import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";
import { CompanionFormSchema } from "@/lib/validators/companion";
import { currentUser } from "@clerk/nextjs";
import { AxiosError } from "axios";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const user = await currentUser();

    const { src, name, description, instructions, seed, categoryId } =
      CompanionFormSchema.parse(body);

    if (!user || !user.id || !user.firstName)
      return new NextResponse("Unauthorized", { status: 401 });

    // prevent if not currently subscribed on pro sub
    const isPro = await checkSubscription();
    if (!isPro)
      return new NextResponse("Pro subscription required", { status: 403 });

    const companion = await prismadb.companion.create({
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
    console.log("[COMPANION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
