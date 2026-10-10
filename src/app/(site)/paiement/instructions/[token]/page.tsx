import { redirect } from "next/navigation";

// Ancienne étape « envoyer une preuve sur Instagram » : supprimée, le paiement est confirmé directement par Stripe.
export default function InstructionsPage({ params }: { params: { token: string } }) {
  redirect(`/confirmation/${params.token}`);
}
