CREATE OR REPLACE FUNCTION execute_sql(sql text) RETURNS SETOF json AS $$ BEGIN RETURN QUERY EXECUTE sql; END; $$ LANGUAGE plpgsql SECURITY DEFINER;
