-- 키워드 검색 함수 수정
-- 문제 1: 별칭 불일치 (sim vs similarity)
-- 문제 2: real vs double precision 타입 불일치
-- 개선: threshold 낮추고, ILIKE 폴백 추가

-- 기존 함수 삭제 후 재생성
drop function if exists search_keyword_chunks(text, int);

-- 수정된 키워드 검색 함수
create or replace function search_keyword_chunks(
  query_text text,
  match_count int default 10
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  article_id int,
  procedure_id int,
  similarity float
)
language plpgsql as $$
begin
  -- pg_trgm similarity threshold 낮추기 (기본 0.3 → 0.1)
  perform set_config('pg_trgm.similarity_threshold', '0.1', true);

  return query
  select
    c.id,
    c.content,
    c.metadata,
    c.article_id,
    c.procedure_id,
    similarity(c.content, query_text)::float as similarity  -- 타입 캐스팅 추가
  from chunks c
  where c.content % query_text  -- trigram similarity 검색
     or c.content ilike '%' || query_text || '%'  -- ILIKE 폴백
  order by similarity(c.content, query_text) desc
  limit match_count;
end; $$;
