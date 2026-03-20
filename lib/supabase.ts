/**
 * Supabase client for cloud sync and auth
 */

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://ceijmmkkqjvwynzqfppo.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlaWptbWtrcWp2d3luenFmcHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTg1OTcsImV4cCI6MjA4OTU5NDU5N30.zuMfBZTz5GN2C1zNTfNYo0YvGIuy0ykoReC3oqATvvU"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
