import { redirect } from 'next/navigation';

export default async function EditRedirectPage({ params }) {
  const { id } = await params;
  redirect(`/projects/edit/${id}`);
}
