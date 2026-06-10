import { NextResponse } from 'next/server'
import { supabase } from '@/app/supabaseClient'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('driver_id, driver_name, driver_number, plat_nomor')

    if (error || !data || data.length === 0) throw new Error('no drivers')

    const random = data[Math.floor(Math.random() * data.length)]
    return NextResponse.json({
      name: random.driver_name,
      phone: random.driver_number,
      vehicle: `Motor · ${random.plat_nomor}`,
      rating: (4.5 + Math.random() * 0.5).toFixed(1),
    })
  } catch {
    return NextResponse.json({
      name: 'Budi Santoso',
      phone: '081234567890',
      vehicle: 'Honda Vario · B 4521 XYZ',
      rating: '4.9',
    })
  }
}