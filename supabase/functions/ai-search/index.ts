import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.21.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SearchRequest {
  query: string;
  filters?: {
    tags?: string[];
    dateRange?: { start?: string; end?: string };
    colorTone?: string;
    isPublic?: boolean;
    storyId?: string;
  };
  userId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const searchRequest: SearchRequest = await req.json();
    const { query, filters, userId } = searchRequest;

    let extractedTags: string[] = [];
    let searchTerms: string[] = [];
    let colorHints: string[] = [];

    if (query && query.trim()) {
      const prompt = `Analyze this photo search query and extract:
1. Relevant tags (as a comma-separated list)
2. Key search terms (as a comma-separated list)
3. Color hints if any (as a comma-separated list, e.g., blue, warm, cool, red)

Query: "${query}"

Respond in this exact JSON format:
{
  "tags": ["tag1", "tag2"],
  "searchTerms": ["term1", "term2"],
  "colorHints": ["color1"]
}`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        extractedTags = parsed.tags || [];
        searchTerms = parsed.searchTerms || [];
        colorHints = parsed.colorHints || [];
      }
    }

    let dbQuery = supabase.from('photos').select('*');

    if (userId) {
      dbQuery = dbQuery.eq('user_id', userId);
    }

    if (filters?.isPublic !== undefined) {
      dbQuery = dbQuery.eq('is_public', filters.isPublic);
    }

    if (filters?.colorTone) {
      dbQuery = dbQuery.eq('color_tone', filters.colorTone);
    } else if (colorHints.length > 0) {
      dbQuery = dbQuery.in('color_tone', colorHints);
    }

    if (filters?.dateRange?.start) {
      dbQuery = dbQuery.gte('created_at', filters.dateRange.start);
    }
    if (filters?.dateRange?.end) {
      dbQuery = dbQuery.lte('created_at', filters.dateRange.end);
    }

    const { data: photos, error } = await dbQuery;

    if (error) throw error;

    let filteredPhotos = photos || [];

    if (filters?.tags && filters.tags.length > 0) {
      const photoIds = filteredPhotos.map(p => p.id);
      const { data: photoTags } = await supabase
        .from('photo_tags')
        .select('photo_id, tag_name')
        .in('photo_id', photoIds);

      const photoTagMap = new Map<string, string[]>();
      photoTags?.forEach(pt => {
        if (!photoTagMap.has(pt.photo_id)) {
          photoTagMap.set(pt.photo_id, []);
        }
        photoTagMap.get(pt.photo_id)!.push(pt.tag_name);
      });

      filteredPhotos = filteredPhotos.filter(photo => {
        const photoTags = photoTagMap.get(photo.id) || [];
        return filters.tags!.some(tag => photoTags.includes(tag));
      });
    }

    if (extractedTags.length > 0 && !filters?.tags) {
      const photoIds = filteredPhotos.map(p => p.id);
      const { data: photoTags } = await supabase
        .from('photo_tags')
        .select('photo_id, tag_name')
        .in('photo_id', photoIds);

      const photoTagMap = new Map<string, string[]>();
      photoTags?.forEach(pt => {
        if (!photoTagMap.has(pt.photo_id)) {
          photoTagMap.set(pt.photo_id, []);
        }
        photoTagMap.get(pt.photo_id)!.push(pt.tag_name);
      });

      filteredPhotos = filteredPhotos.filter(photo => {
        const photoTags = photoTagMap.get(photo.id) || [];
        const aiTags = photo.ai_tags || [];
        const allTags = [...photoTags, ...aiTags];
        return extractedTags.some(tag => 
          allTags.some(pt => pt.toLowerCase().includes(tag.toLowerCase()))
        );
      });
    }

    if (searchTerms.length > 0) {
      filteredPhotos = filteredPhotos.filter(photo => {
        const searchableText = [
          photo.title,
          photo.reason,
          photo.ai_description,
          ...(photo.ai_tags || [])
        ].join(' ').toLowerCase();

        return searchTerms.some(term => 
          searchableText.includes(term.toLowerCase())
        );
      });
    }

    const photosWithTags = await Promise.all(
      filteredPhotos.map(async (photo) => {
        const { data: tags } = await supabase
          .from('photo_tags')
          .select('tag_name')
          .eq('photo_id', photo.id);

        return {
          ...photo,
          tags: tags?.map(t => t.tag_name) || []
        };
      })
    );

    return new Response(
      JSON.stringify({
        photos: photosWithTags,
        metadata: {
          extractedTags,
          searchTerms,
          colorHints,
          totalResults: photosWithTags.length
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('AI search error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});