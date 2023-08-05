import prismadb from "@/lib/prismadb";
import CompanionForm from "./components/CompanionForm";
import { auth, redirectToSignIn } from "@clerk/nextjs";

interface CompanionIdPageProps {
  params: {
    companionId: string;
  };
}

const CompanionIdPage = async ({ params }: CompanionIdPageProps) => {
  const { userId } = auth();
  // TODO: check subscription, redirect away if no active subscription

  if(!userId) 
    return redirectToSignIn()

  const companion = await prismadb.companion.findUnique({
    where: {
      userId: userId,
      id: params.companionId,
    },
  });

  const categories = await prismadb.category.findMany();

  return (
    <div>
      <CompanionForm initialData={companion} categories={categories} />
    </div>
  );
};

export default CompanionIdPage;
