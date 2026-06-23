-- ファンクラブ機能を完全削除

-- FanClubContent → FanClubMember → FanClubTier → FanClub の順でDROP（外部キー制約順）
DROP TABLE IF EXISTS "FanClubContent" CASCADE;
DROP TABLE IF EXISTS "FanClubMember" CASCADE;
DROP TABLE IF EXISTS "FanClubTier" CASCADE;
DROP TABLE IF EXISTS "FanClub" CASCADE;

-- User.fanClubMemberships リレーションは上記CASCADEで除去済み
-- ArtistPage.fanClub リレーションは上記CASCADEで除去済み
