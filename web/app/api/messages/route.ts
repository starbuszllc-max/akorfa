import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations, messages, profiles } from '@akorfa/shared';
import { eq, or, and, desc, sql } from 'drizzle-orm';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const conversationId = searchParams.get('conversationId');

    if (!userId || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid userId required' }, { status: 400 });
    }

    if (conversationId) {
      const msgs = await db
        .select({
          id: messages.id,
          senderId: messages.senderId,
          content: messages.content,
          messageType: messages.messageType,
          mediaUrl: messages.mediaUrl,
          audioDuration: messages.audioDuration,
          isRead: messages.isRead,
          createdAt: messages.createdAt,
          sender: {
            username: profiles.username,
            avatarUrl: profiles.avatarUrl
          }
        })
        .from(messages)
        .leftJoin(profiles, eq(messages.senderId, profiles.id))
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt);

      await db
        .update(messages)
        .set({ isRead: true })
        .where(and(
          eq(messages.conversationId, conversationId),
          sql`${messages.senderId} != ${userId}`
        ));

      return NextResponse.json({ messages: msgs });
    }

    const userConversations = await db
      .select()
      .from(conversations)
      .where(or(
        eq(conversations.participantOneId, userId),
        eq(conversations.participantTwoId, userId)
      ))
      .orderBy(desc(conversations.lastMessageAt));

    const enrichedConversations = await Promise.all(
      userConversations.map(async (conv) => {
        const otherUserId = conv.participantOneId === userId 
          ? conv.participantTwoId 
          : conv.participantOneId;

        const [otherUser] = await db
          .select({
            id: profiles.id,
            username: profiles.username,
            avatarUrl: profiles.avatarUrl
          })
          .from(profiles)
          .where(eq(profiles.id, otherUserId));

        const [lastMessage] = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conv.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        const [unreadCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(messages)
          .where(and(
            eq(messages.conversationId, conv.id),
            eq(messages.isRead, false),
            sql`${messages.senderId} != ${userId}`
          ));

        return {
          id: conv.id,
          otherUser,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            messageType: lastMessage.messageType,
            createdAt: lastMessage.createdAt,
            senderId: lastMessage.senderId
          } : null,
          unreadCount: unreadCount?.count || 0,
          lastMessageAt: conv.lastMessageAt
        };
      })
    );

    return NextResponse.json({ conversations: enrichedConversations });
  } catch (error: any) {
    console.error('Messages GET error:', error);
    const errorMessage = error?.message || 'Unknown error';
    const errorCode = error?.code || 'UNKNOWN';
    return NextResponse.json({ 
      error: 'Failed to fetch messages',
      details: errorMessage,
      code: errorCode,
      hint: error?.hint || null
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { senderId, receiverId, content, messageType, mediaUrl, audioDuration } = await req.json();

    if (!senderId || !receiverId) {
      return NextResponse.json({ error: 'senderId and receiverId required' }, { status: 400 });
    }

    if (!UUID_REGEX.test(senderId) || !UUID_REGEX.test(receiverId)) {
      return NextResponse.json({ error: 'Valid UUIDs required' }, { status: 400 });
    }

    if (!content && !mediaUrl) {
      return NextResponse.json({ error: 'content or mediaUrl required' }, { status: 400 });
    }

    let [conversation] = await db
      .select()
      .from(conversations)
      .where(or(
        and(
          eq(conversations.participantOneId, senderId),
          eq(conversations.participantTwoId, receiverId)
        ),
        and(
          eq(conversations.participantOneId, receiverId),
          eq(conversations.participantTwoId, senderId)
        )
      ));

    if (!conversation) {
      const [newConv] = await db.insert(conversations).values({
        participantOneId: senderId,
        participantTwoId: receiverId
      }).returning();
      conversation = newConv;
    }

    const [message] = await db.insert(messages).values({
      conversationId: conversation.id,
      senderId,
      content: content || null,
      messageType: messageType || 'text',
      mediaUrl: mediaUrl || null,
      audioDuration: audioDuration || null
    }).returning();

    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversation.id));

    return NextResponse.json({ 
      message,
      conversationId: conversation.id
    });
  } catch (error: any) {
    console.error('Messages POST error:', error);
    const errorMessage = error?.message || 'Unknown error';
    const errorCode = error?.code || 'UNKNOWN';
    return NextResponse.json({ 
      error: 'Failed to send message',
      details: errorMessage,
      code: errorCode,
      hint: error?.hint || null
    }, { status: 500 });
  }
}
