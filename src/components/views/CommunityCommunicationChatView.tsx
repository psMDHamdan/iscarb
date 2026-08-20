"use client";
import { useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, Clock } from "lucide-react";

export function CommunityCommunicationChatView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const labels = {
    title: ar ? "الرسائل والدردشة" : "Chat & Messages",
    description: ar ? "تواصل مع الطلاب والمرشدين" : "Communicate with students and mentors",
    conversations: ar ? "المحادثات" : "Conversations",
    sendMessage: ar ? "إرسال" : "Send",
    typeMessage: ar ? "اكتب رسالة..." : "Type a message...",
    noConversations: ar ? "لا توجد محادثات بعد" : "No conversations yet",
    selectConversation: ar ? "اختر محادثة لبدء المراسلة" : "Select a conversation to start messaging",
    unread: ar ? "غير مقروء" : "Unread",
    read: ar ? "مقروء" : "Read",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <StudentPageTemplate
      title={labels.title}
      titleAr={labels.title}
      description={labels.description}
      descriptionAr={labels.description}
      apiEndpoint="/api/v1/student/community/messaging"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "المجتمع" : "Community", href: "/student/community" },
        { label: labels.title, href: "/student/community/communication/chat" },
      ]}
    >
      {(data: any) => (
        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          {/* Conversations List */}
          <Card className="overflow-hidden flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{labels.conversations}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {data?.conversations && data.conversations.length > 0 ? (
                <div className="space-y-1 p-3">
                  {data.conversations.map((conv: any) => (
                    <button
                      key={conv.conversationId}
                      onClick={() => setSelectedConversation(conv.conversationId)}
                      className={`w-full text-left p-3 rounded-lg transition-colors group ${
                        selectedConversation === conv.conversationId
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={conv.otherAvatar} />
                          <AvatarFallback>{getInitials(conv.otherName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">{conv.otherName}</p>
                            {conv.unread && (
                              <span className="inline-block w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-sm text-center px-4">
                    {labels.noConversations}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="overflow-hidden flex flex-col md:col-span-2">
            {selectedConversation && data?.messages ? (
              <>
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-lg">{ar ? "الرسائل" : "Messages"}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {data.messages && data.messages.length > 0 ? (
                    data.messages.map((msg: any) => (
                      <div key={msg.id} className="flex gap-3 group">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={msg.senderAvatar} />
                          <AvatarFallback>{getInitials(msg.senderName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold">{msg.senderName}</p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleTimeString(ar ? "ar-SA" : "en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {msg.read && (
                              <Badge variant="outline" className="text-xs ml-auto">
                                {labels.read}
                              </Badge>
                            )}
                          </div>
                          <div className="bg-accent p-3 rounded-lg break-words">
                            <p className="text-sm">{msg.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground text-sm">{ar ? "لا توجد رسائل بعد" : "No messages yet"}</p>
                    </div>
                  )}
                </CardContent>
                <div className="border-t p-4 space-y-2">
                  <Textarea
                    placeholder={labels.typeMessage}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="resize-none"
                    rows={2}
                  />
                  <Button
                    onClick={() => {
                      if (message.trim()) {
                        setMessage("");
                      }
                    }}
                    disabled={!message.trim()}
                    className="w-full gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {labels.sendMessage}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground">{labels.selectConversation}</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </StudentPageTemplate>
  );
}
