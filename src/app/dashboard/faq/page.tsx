import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { FAQAccordion } from "@/components/faq-accordion"

async function getFaqs() {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from("faqs")
    .select("*")
    .eq("active", true)
    .order("position", { ascending: true })

  return data || []
}

export default async function FAQPage() {
  const faqs = await getFaqs()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">FAQ</h1>
      <div className="max-w-2xl mx-auto">
        {faqs.length > 0 ? (
          <FAQAccordion faqs={faqs} />
        ) : (
          <p className="text-center text-muted-foreground">No FAQs available yet.</p>
        )}
      </div>
    </div>
  )
}
