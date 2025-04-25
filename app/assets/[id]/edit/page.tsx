// app/assets/[id]/edit/page.tsx
import EditAssetForm from "./EditAssetForm";

type Params = Promise<{ id: string }>;

export default async function EditAssetPage(props: { params: Params }) {
  const { id } = await props.params;
  return <EditAssetForm assetId={id} />;
}

