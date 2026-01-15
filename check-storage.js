// Quick storage check script
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkStorage() {
  console.log('Checking storage buckets...');
  const { data, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Buckets:', data);
    const photoBucket = data.find(b => b.id === 'photos');
    if (photoBucket) {
      console.log('✓ Photos bucket exists:', photoBucket);
    } else {
      console.log('✗ Photos bucket NOT found - you need to create it!');
    }
  }
}

checkStorage();
