import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://alxrmllbfdvkplzuhofz.supabase.co'
const supabaseKey = 'sb_publishable_c5iUe97hF7dH1QHDM1D1RA_ubdWA3Ng'

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Leadership = {
  id: string
  username: string
  title: string
  image_url: string | null
  sort_order: number
  created_at: string
}

export type CarouselItem = {
  id: string
  image_url: string
  caption: string | null
  sort_order: number
  created_at: string
}

export type Announcement = {
  id: string
  title: string
  description: string
  date: string
  image_url: string | null
  sort_order: number
  created_at: string
}

export type Regulation = {
  id: string
  number: number
  title: string
  document_url: string
  created_at: string
}

export type StandingOrder = {
  id: string
  number: number
  title: string
  document_url: string
  summary: string | null
  status: string
  date: string | null
  created_at: string
}

export type Memo = {
  id: string
  title: string
  author: string
  date: string
  content: string | null
  document_url: string | null
  created_at: string
}

export type Release = {
  id: string
  type: string
  title: string
  description: string
  date: string
  document_url: string | null
  sort_order: number
  created_at: string
}

export type GalleryItem = {
  id: string
  image_url: string
  caption: string
  category: string
  sort_order: number
  created_at: string
}

export type Setting = {
  id: string
  key: string
  value: string
  created_at: string
}

export type AdminUser = {
  id: string
  email: string
  role: string
  created_at: string
}
