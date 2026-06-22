-- GIN インデックス: プロジェクト全文検索（タイトル + 説明文）
CREATE INDEX IF NOT EXISTS idx_project_fts
ON "Project" USING GIN (
  to_tsvector('simple', title || ' ' || COALESCE(description, ''))
);

-- GIN インデックス: 花屋全文検索（店名 + ポートフォリオ）
CREATE INDEX IF NOT EXISTS idx_florist_fts
ON "Florist" USING GIN (
  to_tsvector('simple', "platformName" || ' ' || COALESCE(portfolio, ''))
);

-- B-tree インデックス: 都道府県フィルタの高速化
CREATE INDEX IF NOT EXISTS idx_project_delivery_address
ON "Project" ("deliveryAddress");

CREATE INDEX IF NOT EXISTS idx_florist_address
ON "Florist" (address);
