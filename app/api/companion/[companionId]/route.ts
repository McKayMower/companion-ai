import prismadb from "@/lib/prismadb";
import { CompanionFormSchema } from "@/lib/validators/companion";
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";

interface IParams {
  params: {
    companionId: string;
  };
}

export async function PATCH(req: Request, params: IParams) {
  try {
    const body = await req.json();

    const { companionId } = params.params;

    if (!companionId)
      return new NextResponse("CompanionId Required", { status: 400 });

    const user = await currentUser();

    const { src, name, description, instructions, seed, categoryId } =
      CompanionFormSchema.parse(body);

    if (!user || !user.id || !user.firstName)
      return new NextResponse("Unauthorized", { status: 401 });

    // TODO: check for stripe subscription
    // prevent if not currently subscribed on pro sub

    const companion = await prismadb.companion.update({
      where: {
        id: companionId,
      },
      data: {
        src: src,
        userName: user.firstName,
        seed: seed,
        name: name,
        description: description,
        instructions: instructions,
        userId: user.id,
        categoryId: categoryId,
      },
    });

    return NextResponse.json(companion);
  } catch (error) {
    console.log("[COMPANION_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { companionId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const companion = await prismadb.companion.delete({
      where: {
        userId,
        id: params.companionId
      }
    });

    return NextResponse.json(companion);
  } catch (error) {
    console.log("[COMPANION_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
};