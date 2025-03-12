-- 사용자 직접 검색 함수
CREATE OR REPLACE FUNCTION search_users_direct(search_query TEXT, page_limit INT, page_offset INT)
RETURNS SETOF JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT jsonb_build_object(
    'id', u.id,
    'name', u.name,
    'phone', u.phone
  )
  FROM users u
  WHERE 
    u.name ILIKE '%' || search_query || '%' OR
    u.phone ILIKE '%' || search_query || '%'
  ORDER BY u.name
  LIMIT page_limit
  OFFSET page_offset;
END;
$$;
