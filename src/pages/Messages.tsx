import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft, MessageText1, SearchNormal } from 'iconsax-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation?.other_user || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedConversation.other_user.id,
          job_id: selectedConversation.job_id,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.job_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fullscreen chat view for mobile
  if (selectedConversation) {
    return (
      <>
        {/* Mobile fullscreen chat */}
        <div className="fixed inset-0 z-[100] bg-background flex flex-col md:hidden">
          <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedConversation(null)}
            >
              <ArrowLeft size={20} />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedConversation.other_user?.avatar_url || ''} />
              <AvatarFallback>
                {selectedConversation.other_user?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {selectedConversation.other_user?.full_name}
              </p>
              {selectedConversation.job_title && (
                <p className="text-xs text-muted-foreground truncate">
                  Re: {selectedConversation.job_title}
                </p>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.sender_id === user?.id ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] px-4 py-2 rounded-2xl",
                      msg.sender_id === user?.id
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    )}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-[10px] mt-1 opacity-70">
                      {format(new Date(msg.created_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border bg-card">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                size="icon"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop chat view */}
        <div className="hidden md:block">
        <Layout title="Messages">
          <div className="h-[calc(100vh-8rem)] flex gap-4">
            <div className="w-80 flex-shrink-0 flex flex-col bg-card rounded-xl border border-border">
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
                    className="pl-9"
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
                        "w-full p-4 flex items-center gap-3 hover:bg-accent transition-colors text-left",
                        selectedConversation?.id === conv.id && "bg-accent"
                      )}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conv.other_user?.avatar_url || ''} />
                        <AvatarFallback>{conv.other_user?.full_name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{conv.other_user?.full_name || 'Unknown'}</p>
                        {conv.last_message && (
                          <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                        )}
                      </div>
                      {conv.unread_count ? (
                        <Badge variant="destructive" className="text-xs">{conv.unread_count}</Badge>
                      ) : null}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="flex-1 bg-card rounded-xl border border-border flex flex-col">
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.other_user?.avatar_url || ''} />
                  <AvatarFallback>{selectedConversation.other_user?.full_name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedConversation.other_user?.full_name}</p>
                  {selectedConversation.job_title && (
                    <p className="text-xs text-muted-foreground">Re: {selectedConversation.job_title}</p>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn("flex", msg.sender_id === user?.id ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] px-4 py-2 rounded-2xl",
                          msg.sender_id === user?.id
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-[10px] mt-1 opacity-70">{format(new Date(msg.created_at), 'HH:mm')}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send size={18} className="mr-2" />
                    Send
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
        <div className="flex-1 md:w-80 md:flex-none flex flex-col bg-card rounded-xl border border-border">
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
                className="pl-9"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageText1 size={48} className="mx-auto mb-2 opacity-50" />
                <p className="font-medium">No conversations yet</p>
                <p className="text-xs mt-1">Start chatting with job posters!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-accent transition-colors text-left"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conv.other_user?.avatar_url || ''} />
                      <AvatarFallback>{conv.other_user?.full_name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{conv.other_user?.full_name || 'Unknown'}</p>
                        {conv.unread_count ? (
                          <Badge variant="destructive" className="text-xs px-2">{conv.unread_count}</Badge>
                        ) : null}
                      </div>
                      {conv.job_title && (
                        <p className="text-xs text-primary truncate">Re: {conv.job_title}</p>
                      )}
                      {conv.last_message && (
                        <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="hidden md:flex flex-1 bg-card rounded-xl border border-border items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageText1 size={64} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm">Choose from your existing conversations</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Messages;
