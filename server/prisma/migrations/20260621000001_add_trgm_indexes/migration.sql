-- pg_trgm 拡張（日本語トライグラム検索）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- プロジェクト: タイトル・説明文のトライグラム GIN インデックス
CREATE INDEX IF NOT EXISTS idx_project_title_trgm
ON "Project" USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_project_description_trgm
ON "Project" USING GIN (description gin_trgm_ops);

-- 花屋: 店名・ポートフォリオのトライグラム GIN インデックス
CREATE INDEX IF NOT EXISTS idx_florist_name_trgm
ON "Florist" USING GIN ("platformName" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_florist_portfolio_trgm
ON "Florist" USING GIN (portfolio gin_trgm_ops);
