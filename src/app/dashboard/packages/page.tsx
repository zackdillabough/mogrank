import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { PackageCard } from "@/components/package-card"

async function getPackages() {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from("packages")
    .select("*")
    .eq("active", true)
    .order("position", { ascending: true })

  return data || []
}

export default async function PackagesPage() {
  const packages = await getPackages()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Choose Your Package</h1>
      <div className="flex flex-wrap justify-center gap-10 max-w-4xl mx-auto py-4">
        {packages.map((pkg, index) => (
          <div key={pkg.id} className="w-full sm:w-[calc(50%-1.25rem)] lg:w-[calc(33.333%-1.75rem)]">
            <PackageCard package={pkg} index={index} isLoggedIn={true} />
          </div>
        ))}
      </div>
    </div>
  )
}
