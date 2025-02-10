import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Conversation from "@/models/conversation";

export async function GET() {
  try {
    await dbConnect();
    const conversations = await Conversation.find()
      .sort({ updatedAt: -1 })
      .lean();
    return NextResponse.json(conversations);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await dbConnect();
    const conversation = await Conversation.create({
      title: "New Conversation",
      messages: [],
    });
    return NextResponse.json(conversation);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
