import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft, MessageText1, SearchNormal, TickCircle, Clock, Microphone2, Paperclip, EmojiHappy } from 'iconsax-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import Layout from '@/components/layout/Layout';

interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  job_id: string | null;
  last_message_at: string;
  other_user?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  job_title?: string;
  unread_count?: number;
  last_message?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
      
      const channel = supabase
        .channel('messages-channel')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        }, (payload) => {
          const newMsg = payload.new as Message;
          if (selectedConversation && 
              ((newMsg.sender_id === user.id || newMsg.receiver_id === user.id))) {
            setMessages(prev => [...prev, newMsg]);
            scrollToBottom();
          }
          fetchConversations();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      const { data: convData, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const enrichedConversations = await Promise.all(
        (convData || []).map(async (conv) => {
          const otherUserId = conv.participant_one === user.id 
            ? conv.participant_two 
            : conv.participant_one;

          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', otherUserId)
            .single();

          let jobTitle = null;
          if (conv.job_id) {
            const { data: jobData } = await supabase
              .from('jobs')
              .select('title')
              .eq('id', conv.job_id)
              .single();
            jobTitle = jobData?.title;
          }

          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', user.id)
            .eq('sender_id', otherUserId)
            .eq('is_read', false);

          const { data: lastMsgData } = await supabase
            .from('messages')
            .select('content')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            other_user: profileData,
            job_title: jobTitle,
            unread_count: count || 0,
            last_message: lastMsgData?.content
          };
        })
      );

      setConversations(enrichedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversation: Conversation) => {
    if (!user || !conversation.other_user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conversation.other_user.id}),and(sender_id.eq.${conversation.other_user.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', conversation.other_user.id);

    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    fetchMessages(conv);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation?.other_user || !user || sendingMessage) return;

    setSendingMessage(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedConversation.other_user.id,
          job_id: selectedConversation.job_id,
          content: messageContent
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday ' + format(date, 'HH:mm');
    return format(date, 'MMM d, HH:mm');
  };

  const formatConversationDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.job_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach(msg => {
      const date = new Date(msg.created_at);
      let key = format(date, 'yyyy-MM-dd');
      if (isToday(date)) key = 'Today';
      else if (isYesterday(date)) key = 'Yesterday';
      else key = format(date, 'MMMM d, yyyy');
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(msg);
    });
    return groups;
  };

  // Fullscreen chat view for mobile
  if (selectedConversation) {
    const groupedMessages = groupMessagesByDate(messages);

    return (
      <>
        {/* Mobile fullscreen chat */}
        <div className="fixed inset-0 z-[100] bg-background flex flex-col md:hidden">
          {/* Chat Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border bg-card/95 backdrop-blur-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedConversation(null)}
              className="hover:bg-accent"
            >
              <ArrowLeft size={20} />
            </Button>
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={selectedConversation.other_user?.avatar_url || ''} />
              <AvatarFallback className="bg-gradient-to-br from-brand-red to-brand-orange text-white">
                {selectedConversation.other_user?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {selectedConversation.other_user?.full_name}
              </p>
              {selectedConversation.job_title && (
                <p className="text-xs text-primary truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Re: {selectedConversation.job_title}
                </p>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-accent/30 to-background">
            <div className="space-y-4">
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  <div className="flex justify-center mb-3">
                    <span className="text-xs text-muted-foreground bg-card px-3 py-1 rounded-full shadow-sm">
                      {date}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {msgs.map((msg, idx) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex animate-fade-in",
                          msg.sender_id === user?.id ? "justify-end" : "justify-start"
                        )}
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] px-4 py-2.5 shadow-sm",
                            msg.sender_id === user?.id
                              ? "bg-gradient-to-br from-brand-red to-brand-orange text-white rounded-2xl rounded-br-md"
                              : "bg-card border border-border rounded-2xl rounded-bl-md"
                          )}
                        >
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <div className={cn(
                            "flex items-center gap-1 mt-1",
                            msg.sender_id === user?.id ? "justify-end" : "justify-start"
                          )}>
                            <p className={cn(
                              "text-[10px]",
                              msg.sender_id === user?.id ? "text-white/70" : "text-muted-foreground"
                            )}>
                              {format(new Date(msg.created_at), 'HH:mm')}
                            </p>
                            {msg.sender_id === user?.id && (
                              <TickCircle 
                                size={12} 
                                variant={msg.is_read ? "Bold" : "Linear"}
                                className={msg.is_read ? "text-white" : "text-white/50"} 
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-3 border-t border-border bg-card/95 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
                <EmojiHappy size={22} />
              </Button>
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="pr-10 h-11 rounded-full bg-accent/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Paperclip size={18} />
                </Button>
              </div>
              <Button 
                onClick={sendMessage}
                disabled={!newMessage.trim() || sendingMessage}
                size="icon"
                className="shrink-0 h-11 w-11 rounded-full bg-gradient-to-br from-brand-red to-brand-orange hover:opacity-90 transition-all"
              >
                {sendingMessage ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : newMessage.trim() ? (
                  <Send size={18} className="text-white" />
                ) : (
                  <Microphone2 size={18} className="text-white" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop chat view */}
        <div className="hidden md:block">
          <Layout title="Messages">
            <div className="h-[calc(100vh-8rem)] flex gap-4">
              {/* Conversations sidebar */}
              <div className="w-80 flex-shrink-0 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
                    <MessageText1 size={20} variant="Bold" className="text-primary" />
                    Conversations
                  </h2>
                  <div className="relative">
                    <SearchNormal size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-accent/50 border-0"
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="divide-y divide-border">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => selectConversation(conv)}
                        className={cn(
                          "w-full p-4 flex items-center gap-3 hover:bg-accent/50 transition-all text-left",
                          selectedConversation?.id === conv.id && "bg-accent"
                        )}
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={conv.other_user?.avatar_url || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-brand-red to-brand-orange text-white">
                              {conv.other_user?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{conv.other_user?.full_name || 'Unknown'}</p>
                            <span className="text-xs text-muted-foreground">
                              {conv.last_message_at && formatConversationDate(conv.last_message_at)}
                            </span>
                          </div>
                          {conv.job_title && (
                            <p className="text-xs text-primary truncate">Re: {conv.job_title}</p>
                          )}
                          <div className="flex items-center justify-between">
                            {conv.last_message && (
                              <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                            )}
                            {conv.unread_count ? (
                              <Badge className="bg-gradient-to-r from-brand-red to-brand-orange text-white text-xs px-2 ml-2">
                                {conv.unread_count}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Chat area */}
              <div className="flex-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b border-border">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                    <AvatarImage src={selectedConversation.other_user?.avatar_url || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-brand-red to-brand-orange text-white">
                      {selectedConversation.other_user?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedConversation.other_user?.full_name}</p>
                    {selectedConversation.job_title && (
                      <p className="text-xs text-primary flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Re: {selectedConversation.job_title}
                      </p>
                    )}
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-accent/20 to-transparent">
                  <div className="space-y-4">
                    {Object.entries(groupedMessages).map(([date, msgs]) => (
                      <div key={date}>
                        <div className="flex justify-center mb-3">
                          <span className="text-xs text-muted-foreground bg-accent px-3 py-1 rounded-full">
                            {date}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {msgs.map((msg) => (
                            <div
                              key={msg.id}
                              className={cn("flex", msg.sender_id === user?.id ? "justify-end" : "justify-start")}
                            >
                              <div
                                className={cn(
                                  "max-w-[70%] px-4 py-2.5 shadow-sm",
                                  msg.sender_id === user?.id
                                    ? "bg-gradient-to-br from-brand-red to-brand-orange text-white rounded-2xl rounded-br-md"
                                    : "bg-accent rounded-2xl rounded-bl-md"
                                )}
                              >
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                <div className={cn(
                                  "flex items-center gap-1 mt-1",
                                  msg.sender_id === user?.id ? "justify-end" : "justify-start"
                                )}>
                                  <p className={cn(
                                    "text-[10px]",
                                    msg.sender_id === user?.id ? "text-white/70" : "text-muted-foreground"
                                  )}>
                                    {format(new Date(msg.created_at), 'HH:mm')}
                                  </p>
                                  {msg.sender_id === user?.id && (
                                    <TickCircle 
                                      size={12} 
                                      variant={msg.is_read ? "Bold" : "Linear"}
                                      className={msg.is_read ? "text-white" : "text-white/50"} 
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <EmojiHappy size={20} />
                    </Button>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Paperclip size={20} />
                    </Button>
                    <Input
                      ref={inputRef}
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1 bg-accent/50 border-0"
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim() || sendingMessage}
                      className="bg-gradient-to-r from-brand-red to-brand-orange hover:opacity-90"
                    >
                      {sendingMessage ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <Send size={18} className="mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Layout>
        </div>
      </>
    );
  }

  // Conversation list view
  return (
    <Layout title="Messages">
      <div className="h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4">
        <div className="flex-1 md:w-80 md:flex-none flex flex-col bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <MessageText1 size={20} variant="Bold" className="text-primary" />
              Conversations
            </h2>
            <div className="relative">
              <SearchNormal size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-accent/50 border-0"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center">
                <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="mt-2 text-sm text-muted-foreground">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent flex items-center justify-center">
                  <MessageText1 size={32} className="opacity-50" />
                </div>
                <p className="font-medium">No conversations yet</p>
                <p className="text-xs mt-1">Start chatting with job posters!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredConversations.map((conv, idx) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-accent/50 transition-all text-left animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conv.other_user?.avatar_url || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-brand-red to-brand-orange text-white">
                          {conv.other_user?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{conv.other_user?.full_name || 'Unknown'}</p>
                        <span className="text-xs text-muted-foreground">
                          {conv.last_message_at && formatConversationDate(conv.last_message_at)}
                        </span>
                      </div>
                      {conv.job_title && (
                        <p className="text-xs text-primary truncate">Re: {conv.job_title}</p>
                      )}
                      <div className="flex items-center justify-between">
                        {conv.last_message && (
                          <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                        )}
                        {conv.unread_count ? (
                          <Badge className="bg-gradient-to-r from-brand-red to-brand-orange text-white text-xs px-2 ml-2">
                            {conv.unread_count}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="hidden md:flex flex-1 bg-card rounded-xl border border-border items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center">
              <MessageText1 size={40} className="opacity-50" />
            </div>
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm mt-1">Choose a chat from the list to start messaging</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Messages;