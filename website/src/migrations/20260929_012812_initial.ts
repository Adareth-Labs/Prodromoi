import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_solutions_vehicle_segments" AS ENUM('passenger-cars', 'commercial-vehicles', 'off-highway', 'motorcycles-powersports');
  CREATE TYPE "public"."enum_solutions_certifications" AS ENUM('IATF 16949', 'ISO 9001:2015', 'ISO 14001', 'ISO 26262 ASIL D', 'ISO 26262 ASIL B', 'REACH', 'RoHS');
  CREATE TYPE "public"."enum_solutions_domain" AS ENUM('EV', 'ADAS', 'Powertrain', 'Thermal', 'Chassis', 'Connected', 'Interiors');
  CREATE TYPE "public"."enum_solutions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_solutions_lifecycle_status" AS ENUM('active-production', 'beta-validation', 'engineering-sample', 'end-of-life');
  CREATE TYPE "public"."enum__solutions_v_version_vehicle_segments" AS ENUM('passenger-cars', 'commercial-vehicles', 'off-highway', 'motorcycles-powersports');
  CREATE TYPE "public"."enum__solutions_v_version_certifications" AS ENUM('IATF 16949', 'ISO 9001:2015', 'ISO 14001', 'ISO 26262 ASIL D', 'ISO 26262 ASIL B', 'REACH', 'RoHS');
  CREATE TYPE "public"."enum__solutions_v_version_domain" AS ENUM('EV', 'ADAS', 'Powertrain', 'Thermal', 'Chassis', 'Connected', 'Interiors');
  CREATE TYPE "public"."enum__solutions_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__solutions_v_version_lifecycle_status" AS ENUM('active-production', 'beta-validation', 'engineering-sample', 'end-of-life');
  CREATE TYPE "public"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_articles_domain" AS ENUM('EV', 'ADAS', 'Powertrain', 'Thermal', 'Chassis', 'Connected');
  CREATE TYPE "public"."enum_articles_topic_category" AS ENUM('software-defined-vehicle', 'electrification', 'hydrogen-fuel-cell', 'cybersecurity', 'ee-architecture', 'autonomous-driving', 'circular-economy');
  CREATE TYPE "public"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articles_v_version_domain" AS ENUM('EV', 'ADAS', 'Powertrain', 'Thermal', 'Chassis', 'Connected');
  CREATE TYPE "public"."enum__articles_v_version_topic_category" AS ENUM('software-defined-vehicle', 'electrification', 'hydrogen-fuel-cell', 'cybersecurity', 'ee-architecture', 'autonomous-driving', 'circular-economy');
  CREATE TYPE "public"."enum_news_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_news_type" AS ENUM('press-release', 'award', 'partnership', 'product-update', 'event');
  CREATE TYPE "public"."enum_news_topic_category" AS ENUM('technical', 'corporate', 'esg', 'financial', 'partnerships');
  CREATE TYPE "public"."enum__news_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__news_v_version_type" AS ENUM('press-release', 'award', 'partnership', 'product-update', 'event');
  CREATE TYPE "public"."enum__news_v_version_topic_category" AS ENUM('technical', 'corporate', 'esg', 'financial', 'partnerships');
  CREATE TYPE "public"."enum_leadership_department" AS ENUM('executive', 'engineering', 'operations', 'commercial', 'finance', 'hr');
  CREATE TYPE "public"."enum_facilities_specialties" AS ENUM('battery', 'machining', 'thermal', 'adas', 'software', 'moulding');
  CREATE TYPE "public"."enum_facilities_facility_type" AS ENUM('manufacturing', 'rd-centre', 'sales-office');
  CREATE TYPE "public"."enum_facilities_status" AS ENUM('operational', 'construction', 'planned');
  CREATE TYPE "public"."enum_board_members_type" AS ENUM('executive', 'independent', 'non-executive');
  CREATE TABLE "solutions_vehicle_segments" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_solutions_vehicle_segments",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "solutions_certifications" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_solutions_certifications",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "solutions_specs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"unit" varchar
  );
  
  CREATE TABLE "solutions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"domain" "enum_solutions_domain",
  	"status" "enum_solutions_status" DEFAULT 'draft',
  	"lifecycle_status" "enum_solutions_lifecycle_status",
  	"part_family" varchar,
  	"technical_data_sheet_url" varchar,
  	"featured_on_homepage" boolean DEFAULT false,
  	"summary" varchar,
  	"hero_image_id" integer,
  	"body" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_solutions_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "solutions_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_solutions_v_version_vehicle_segments" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__solutions_v_version_vehicle_segments",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_solutions_v_version_certifications" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__solutions_v_version_certifications",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_solutions_v_version_specs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"unit" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_solutions_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_domain" "enum__solutions_v_version_domain",
  	"version_status" "enum__solutions_v_version_status" DEFAULT 'draft',
  	"version_lifecycle_status" "enum__solutions_v_version_lifecycle_status",
  	"version_part_family" varchar,
  	"version_technical_data_sheet_url" varchar,
  	"version_featured_on_homepage" boolean DEFAULT false,
  	"version_summary" varchar,
  	"version_hero_image_id" integer,
  	"version_body" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__solutions_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_solutions_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"published_at" timestamp(3) with time zone,
  	"status" "enum_articles_status" DEFAULT 'draft',
  	"domain" "enum_articles_domain",
  	"topic_category" "enum_articles_topic_category",
  	"author_name" varchar,
  	"author_role" varchar,
  	"read_time_minutes" numeric,
  	"is_white_paper" boolean DEFAULT false,
  	"white_paper_asset_id" integer,
  	"featured_on_homepage" boolean DEFAULT false,
  	"excerpt" varchar,
  	"cover_image_id" integer,
  	"body" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "articles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"solutions_id" integer
  );
  
  CREATE TABLE "_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_status" "enum__articles_v_version_status" DEFAULT 'draft',
  	"version_domain" "enum__articles_v_version_domain",
  	"version_topic_category" "enum__articles_v_version_topic_category",
  	"version_author_name" varchar,
  	"version_author_role" varchar,
  	"version_read_time_minutes" numeric,
  	"version_is_white_paper" boolean DEFAULT false,
  	"version_white_paper_asset_id" integer,
  	"version_featured_on_homepage" boolean DEFAULT false,
  	"version_excerpt" varchar,
  	"version_cover_image_id" integer,
  	"version_body" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_articles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"solutions_id" integer
  );
  
  CREATE TABLE "news" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"published_at" timestamp(3) with time zone,
  	"status" "enum_news_status" DEFAULT 'draft',
  	"type" "enum_news_type",
  	"topic_category" "enum_news_topic_category",
  	"attribution" varchar,
  	"read_time_minutes" numeric,
  	"featured_material" boolean DEFAULT false,
  	"excerpt" varchar,
  	"body" jsonb,
  	"external_url" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_news_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_news_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_status" "enum__news_v_version_status" DEFAULT 'draft',
  	"version_type" "enum__news_v_version_type",
  	"version_topic_category" "enum__news_v_version_topic_category",
  	"version_attribution" varchar,
  	"version_read_time_minutes" numeric,
  	"version_featured_material" boolean DEFAULT false,
  	"version_excerpt" varchar,
  	"version_body" jsonb,
  	"version_external_url" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__news_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "leadership" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"job_title" varchar NOT NULL,
  	"department" "enum_leadership_department",
  	"bio" jsonb,
  	"portrait_id" integer NOT NULL,
  	"linkedin" varchar,
  	"order" numeric DEFAULT 99,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "facilities_certifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"year" numeric
  );
  
  CREATE TABLE "facilities_specialties" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_facilities_specialties",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "facilities" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"location" varchar NOT NULL,
  	"country" varchar NOT NULL,
  	"country_code" varchar,
  	"facility_type" "enum_facilities_facility_type",
  	"status" "enum_facilities_status" DEFAULT 'operational',
  	"floor_area_m2" numeric,
  	"headcount" numeric,
  	"employee_range" varchar,
  	"iatf_certified" boolean DEFAULT false,
  	"hero_image_id" integer,
  	"coordinates_lat" numeric,
  	"coordinates_lng" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "facilities_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "board_members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"committee" varchar,
  	"type" "enum_board_members_type" NOT NULL,
  	"order" numeric DEFAULT 99,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"caption" varchar,
  	"prefix" varchar DEFAULT 'cms-media',
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"department" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"solutions_id" integer,
  	"articles_id" integer,
  	"news_id" integer,
  	"leadership_id" integer,
  	"facilities_id" integer,
  	"board_members_id" integer,
  	"media_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_metrics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"revenue_run_rate" varchar NOT NULL,
  	"revenue_year" varchar NOT NULL,
  	"facility_count" numeric NOT NULL,
  	"headcount" numeric NOT NULL,
  	"iatf_certified_count" numeric NOT NULL,
  	"country_count" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "solutions_vehicle_segments" ADD CONSTRAINT "solutions_vehicle_segments_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "solutions_certifications" ADD CONSTRAINT "solutions_certifications_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "solutions_specs" ADD CONSTRAINT "solutions_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "solutions" ADD CONSTRAINT "solutions_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "solutions" ADD CONSTRAINT "solutions_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "solutions_texts" ADD CONSTRAINT "solutions_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_solutions_v_version_vehicle_segments" ADD CONSTRAINT "_solutions_v_version_vehicle_segments_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_solutions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_solutions_v_version_certifications" ADD CONSTRAINT "_solutions_v_version_certifications_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_solutions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_solutions_v_version_specs" ADD CONSTRAINT "_solutions_v_version_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_solutions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_solutions_v" ADD CONSTRAINT "_solutions_v_parent_id_solutions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."solutions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_solutions_v" ADD CONSTRAINT "_solutions_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_solutions_v" ADD CONSTRAINT "_solutions_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_solutions_v_texts" ADD CONSTRAINT "_solutions_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_solutions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_white_paper_asset_id_media_id_fk" FOREIGN KEY ("white_paper_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_solutions_fk" FOREIGN KEY ("solutions_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_white_paper_asset_id_media_id_fk" FOREIGN KEY ("version_white_paper_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_solutions_fk" FOREIGN KEY ("solutions_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_parent_id_news_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leadership" ADD CONSTRAINT "leadership_portrait_id_media_id_fk" FOREIGN KEY ("portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "facilities_certifications" ADD CONSTRAINT "facilities_certifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "facilities_specialties" ADD CONSTRAINT "facilities_specialties_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "facilities" ADD CONSTRAINT "facilities_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "facilities_texts" ADD CONSTRAINT "facilities_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_solutions_fk" FOREIGN KEY ("solutions_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leadership_fk" FOREIGN KEY ("leadership_id") REFERENCES "public"."leadership"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_facilities_fk" FOREIGN KEY ("facilities_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_board_members_fk" FOREIGN KEY ("board_members_id") REFERENCES "public"."board_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "solutions_vehicle_segments_order_idx" ON "solutions_vehicle_segments" USING btree ("order");
  CREATE INDEX "solutions_vehicle_segments_parent_idx" ON "solutions_vehicle_segments" USING btree ("parent_id");
  CREATE INDEX "solutions_certifications_order_idx" ON "solutions_certifications" USING btree ("order");
  CREATE INDEX "solutions_certifications_parent_idx" ON "solutions_certifications" USING btree ("parent_id");
  CREATE INDEX "solutions_specs_order_idx" ON "solutions_specs" USING btree ("_order");
  CREATE INDEX "solutions_specs_parent_id_idx" ON "solutions_specs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "solutions_slug_idx" ON "solutions" USING btree ("slug");
  CREATE INDEX "solutions_hero_image_idx" ON "solutions" USING btree ("hero_image_id");
  CREATE INDEX "solutions_seo_seo_og_image_idx" ON "solutions" USING btree ("seo_og_image_id");
  CREATE INDEX "solutions_updated_at_idx" ON "solutions" USING btree ("updated_at");
  CREATE INDEX "solutions_created_at_idx" ON "solutions" USING btree ("created_at");
  CREATE INDEX "solutions__status_idx" ON "solutions" USING btree ("_status");
  CREATE INDEX "solutions_texts_order_parent" ON "solutions_texts" USING btree ("order","parent_id");
  CREATE INDEX "_solutions_v_version_vehicle_segments_order_idx" ON "_solutions_v_version_vehicle_segments" USING btree ("order");
  CREATE INDEX "_solutions_v_version_vehicle_segments_parent_idx" ON "_solutions_v_version_vehicle_segments" USING btree ("parent_id");
  CREATE INDEX "_solutions_v_version_certifications_order_idx" ON "_solutions_v_version_certifications" USING btree ("order");
  CREATE INDEX "_solutions_v_version_certifications_parent_idx" ON "_solutions_v_version_certifications" USING btree ("parent_id");
  CREATE INDEX "_solutions_v_version_specs_order_idx" ON "_solutions_v_version_specs" USING btree ("_order");
  CREATE INDEX "_solutions_v_version_specs_parent_id_idx" ON "_solutions_v_version_specs" USING btree ("_parent_id");
  CREATE INDEX "_solutions_v_parent_idx" ON "_solutions_v" USING btree ("parent_id");
  CREATE INDEX "_solutions_v_version_version_slug_idx" ON "_solutions_v" USING btree ("version_slug");
  CREATE INDEX "_solutions_v_version_version_hero_image_idx" ON "_solutions_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_solutions_v_version_seo_version_seo_og_image_idx" ON "_solutions_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_solutions_v_version_version_updated_at_idx" ON "_solutions_v" USING btree ("version_updated_at");
  CREATE INDEX "_solutions_v_version_version_created_at_idx" ON "_solutions_v" USING btree ("version_created_at");
  CREATE INDEX "_solutions_v_version_version__status_idx" ON "_solutions_v" USING btree ("version__status");
  CREATE INDEX "_solutions_v_created_at_idx" ON "_solutions_v" USING btree ("created_at");
  CREATE INDEX "_solutions_v_updated_at_idx" ON "_solutions_v" USING btree ("updated_at");
  CREATE INDEX "_solutions_v_latest_idx" ON "_solutions_v" USING btree ("latest");
  CREATE INDEX "_solutions_v_autosave_idx" ON "_solutions_v" USING btree ("autosave");
  CREATE INDEX "_solutions_v_texts_order_parent" ON "_solutions_v_texts" USING btree ("order","parent_id");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX "articles_white_paper_asset_idx" ON "articles" USING btree ("white_paper_asset_id");
  CREATE INDEX "articles_cover_image_idx" ON "articles" USING btree ("cover_image_id");
  CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "articles" USING btree ("_status");
  CREATE INDEX "articles_rels_order_idx" ON "articles_rels" USING btree ("order");
  CREATE INDEX "articles_rels_parent_idx" ON "articles_rels" USING btree ("parent_id");
  CREATE INDEX "articles_rels_path_idx" ON "articles_rels" USING btree ("path");
  CREATE INDEX "articles_rels_solutions_id_idx" ON "articles_rels" USING btree ("solutions_id");
  CREATE INDEX "_articles_v_parent_idx" ON "_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_version_white_paper_asset_idx" ON "_articles_v" USING btree ("version_white_paper_asset_id");
  CREATE INDEX "_articles_v_version_version_cover_image_idx" ON "_articles_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_latest_idx" ON "_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_autosave_idx" ON "_articles_v" USING btree ("autosave");
  CREATE INDEX "_articles_v_rels_order_idx" ON "_articles_v_rels" USING btree ("order");
  CREATE INDEX "_articles_v_rels_parent_idx" ON "_articles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_articles_v_rels_path_idx" ON "_articles_v_rels" USING btree ("path");
  CREATE INDEX "_articles_v_rels_solutions_id_idx" ON "_articles_v_rels" USING btree ("solutions_id");
  CREATE UNIQUE INDEX "news_slug_idx" ON "news" USING btree ("slug");
  CREATE INDEX "news_updated_at_idx" ON "news" USING btree ("updated_at");
  CREATE INDEX "news_created_at_idx" ON "news" USING btree ("created_at");
  CREATE INDEX "news__status_idx" ON "news" USING btree ("_status");
  CREATE INDEX "_news_v_parent_idx" ON "_news_v" USING btree ("parent_id");
  CREATE INDEX "_news_v_version_version_slug_idx" ON "_news_v" USING btree ("version_slug");
  CREATE INDEX "_news_v_version_version_updated_at_idx" ON "_news_v" USING btree ("version_updated_at");
  CREATE INDEX "_news_v_version_version_created_at_idx" ON "_news_v" USING btree ("version_created_at");
  CREATE INDEX "_news_v_version_version__status_idx" ON "_news_v" USING btree ("version__status");
  CREATE INDEX "_news_v_created_at_idx" ON "_news_v" USING btree ("created_at");
  CREATE INDEX "_news_v_updated_at_idx" ON "_news_v" USING btree ("updated_at");
  CREATE INDEX "_news_v_latest_idx" ON "_news_v" USING btree ("latest");
  CREATE INDEX "_news_v_autosave_idx" ON "_news_v" USING btree ("autosave");
  CREATE INDEX "leadership_portrait_idx" ON "leadership" USING btree ("portrait_id");
  CREATE INDEX "leadership_updated_at_idx" ON "leadership" USING btree ("updated_at");
  CREATE INDEX "leadership_created_at_idx" ON "leadership" USING btree ("created_at");
  CREATE INDEX "facilities_certifications_order_idx" ON "facilities_certifications" USING btree ("_order");
  CREATE INDEX "facilities_certifications_parent_id_idx" ON "facilities_certifications" USING btree ("_parent_id");
  CREATE INDEX "facilities_specialties_order_idx" ON "facilities_specialties" USING btree ("order");
  CREATE INDEX "facilities_specialties_parent_idx" ON "facilities_specialties" USING btree ("parent_id");
  CREATE INDEX "facilities_hero_image_idx" ON "facilities" USING btree ("hero_image_id");
  CREATE INDEX "facilities_updated_at_idx" ON "facilities" USING btree ("updated_at");
  CREATE INDEX "facilities_created_at_idx" ON "facilities" USING btree ("created_at");
  CREATE INDEX "facilities_texts_order_parent" ON "facilities_texts" USING btree ("order","parent_id");
  CREATE INDEX "board_members_updated_at_idx" ON "board_members" USING btree ("updated_at");
  CREATE INDEX "board_members_created_at_idx" ON "board_members" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_solutions_id_idx" ON "payload_locked_documents_rels" USING btree ("solutions_id");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_news_id_idx" ON "payload_locked_documents_rels" USING btree ("news_id");
  CREATE INDEX "payload_locked_documents_rels_leadership_id_idx" ON "payload_locked_documents_rels" USING btree ("leadership_id");
  CREATE INDEX "payload_locked_documents_rels_facilities_id_idx" ON "payload_locked_documents_rels" USING btree ("facilities_id");
  CREATE INDEX "payload_locked_documents_rels_board_members_id_idx" ON "payload_locked_documents_rels" USING btree ("board_members_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "solutions_vehicle_segments" CASCADE;
  DROP TABLE "solutions_certifications" CASCADE;
  DROP TABLE "solutions_specs" CASCADE;
  DROP TABLE "solutions" CASCADE;
  DROP TABLE "solutions_texts" CASCADE;
  DROP TABLE "_solutions_v_version_vehicle_segments" CASCADE;
  DROP TABLE "_solutions_v_version_certifications" CASCADE;
  DROP TABLE "_solutions_v_version_specs" CASCADE;
  DROP TABLE "_solutions_v" CASCADE;
  DROP TABLE "_solutions_v_texts" CASCADE;
  DROP TABLE "articles" CASCADE;
  DROP TABLE "articles_rels" CASCADE;
  DROP TABLE "_articles_v" CASCADE;
  DROP TABLE "_articles_v_rels" CASCADE;
  DROP TABLE "news" CASCADE;
  DROP TABLE "_news_v" CASCADE;
  DROP TABLE "leadership" CASCADE;
  DROP TABLE "facilities_certifications" CASCADE;
  DROP TABLE "facilities_specialties" CASCADE;
  DROP TABLE "facilities" CASCADE;
  DROP TABLE "facilities_texts" CASCADE;
  DROP TABLE "board_members" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_metrics" CASCADE;
  DROP TYPE "public"."enum_solutions_vehicle_segments";
  DROP TYPE "public"."enum_solutions_certifications";
  DROP TYPE "public"."enum_solutions_domain";
  DROP TYPE "public"."enum_solutions_status";
  DROP TYPE "public"."enum_solutions_lifecycle_status";
  DROP TYPE "public"."enum__solutions_v_version_vehicle_segments";
  DROP TYPE "public"."enum__solutions_v_version_certifications";
  DROP TYPE "public"."enum__solutions_v_version_domain";
  DROP TYPE "public"."enum__solutions_v_version_status";
  DROP TYPE "public"."enum__solutions_v_version_lifecycle_status";
  DROP TYPE "public"."enum_articles_status";
  DROP TYPE "public"."enum_articles_domain";
  DROP TYPE "public"."enum_articles_topic_category";
  DROP TYPE "public"."enum__articles_v_version_status";
  DROP TYPE "public"."enum__articles_v_version_domain";
  DROP TYPE "public"."enum__articles_v_version_topic_category";
  DROP TYPE "public"."enum_news_status";
  DROP TYPE "public"."enum_news_type";
  DROP TYPE "public"."enum_news_topic_category";
  DROP TYPE "public"."enum__news_v_version_status";
  DROP TYPE "public"."enum__news_v_version_type";
  DROP TYPE "public"."enum__news_v_version_topic_category";
  DROP TYPE "public"."enum_leadership_department";
  DROP TYPE "public"."enum_facilities_specialties";
  DROP TYPE "public"."enum_facilities_facility_type";
  DROP TYPE "public"."enum_facilities_status";
  DROP TYPE "public"."enum_board_members_type";`)
}
