import React, { useEffect, useState, useCallback } from "react";
import { Plus, Users, Phone, Video, MessageSquare, X } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import MessageThread from "../components/MessageThread.jsx";
import CallPanel from "../components/CallPanel.jsx";
import Modal from "../components/Modal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useUnread } from "../context/UnreadContext.jsx";
import api from "../api/axios.js";

const canCreateGroups = (role) => role === "admin" || role === "teamlead";

const ConversationRow = ({ convo, active, onClick, myId, unread }) => {
  const isDirect = convo.type === "direct";
  const other = isDirect ? convo.members.find((m) => m._id !== myId) : null;
  const title = isDirect ? other?.name : convo.name;
  const preview = convo.lastMessage?.text || (convo.lastMessage?.attachment ? "Sent an attachment" : "No messages yet");

  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors ${active ? "bg-white/15" : "hover:bg-white/[0.06]"}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${isDirect ? "bg-accent-blue/20 text-accent-blue" : "bg-accent-amber/20 text-accent-amber"}`}>
        {isDirect ? title?.[0]?.toUpperCase() : <Users size={15} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm truncate ${unread > 0 ? "font-semibold text-cream" : "font-medium text-cream/90"}`}>{title}</p>
        <p className="text-xs text-muted truncate">{preview}</p>
      </div>
      {unread > 0 && (
        <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-red text-white text-[10px] font-bold flex items-center justify-center">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
};

const Messages = () => {
  const { user } = useAuth();
  const { counts, seedCounts, setActiveConversation, markRead } = useUnread();
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showNewDirect, setShowNewDirect] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "", memberIds: [] });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeCall, setActiveCall] = useState(null); // { video: bool }

  const fetchConversations = useCallback(async () => {
    const res = await api.get("/conversations");
    setConversations(res.data.conversations);
    seedCounts(res.data.conversations);
  }, [seedCounts]);

  useEffect(() => {
    fetchConversations();
    api.get("/users/contacts").then((res) => setContacts(res.data.users.filter((u) => u._id !== user._id)));
  }, [fetchConversations, user._id]);

  useEffect(() => {
    // Clear "active conversation" tracking when leaving the Messages page entirely
    return () => setActiveConversation(null);
  }, [setActiveConversation]);

  const selectConversation = (convo) => {
    setSelected(convo);
    setActiveCall(null);
    setActiveConversation(convo._id);
    markRead(convo._id);
  };

  const openDirect = async (userId) => {
    const res = await api.post("/conversations/direct", { userId });
    setShowNewDirect(false);
    await fetchConversations();
    selectConversation(res.data.conversation);
  };

  const createGroup = async (e) => {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const res = await api.post("/conversations/group", groupForm);
      setShowNewGroup(false);
      setGroupForm({ name: "", memberIds: [] });
      await fetchConversations();
      selectConversation(res.data.conversation);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create group");
    } finally { setSaving(false); }
  };

  const toggleGroupMember = (id) => {
    setGroupForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(id) ? f.memberIds.filter((m) => m !== id) : [...f.memberIds, id],
    }));
  };

  const selectedTitle = selected
    ? selected.type === "direct"
      ? selected.members.find((m) => m._id !== user._id)?.name
      : selected.name
    : "";

  return (
    <DashboardLayout title="Messages" subtitle="Direct chats and group conversations, with calls and file sharing built in">
      <div className="card overflow-hidden h-[calc(100vh-160px)] flex">
        {/* Conversation list */}
        <div className="w-72 border-r border-white/10 flex flex-col flex-shrink-0">
          <div className="p-3 flex items-center gap-2 border-b border-white/10">
            <button onClick={() => setShowNewDirect(true)} className="btn-secondary flex-1 text-xs !py-2">
              <Plus size={14} /> New message
            </button>
            {canCreateGroups(user.role) && (
              <button onClick={() => setShowNewGroup(true)} className="btn-secondary !p-2" title="New group">
                <Users size={15} />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 && <p className="text-xs text-muted text-center py-8 px-3">No conversations yet — start one.</p>}
            {conversations.map((c) => (
              <ConversationRow key={c._id} convo={c} active={selected?._id === c._id} myId={user._id} unread={counts[c._id] || 0} onClick={() => selectConversation(c)} />
            ))}
          </div>
        </div>

        {/* Active conversation */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted gap-2">
              <MessageSquare size={32} />
              <p className="text-sm">Pick a conversation, or start a new one.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-5 h-14 border-b border-white/10 flex-shrink-0">
                <p className="font-display font-semibold text-sm text-cream">{selectedTitle}</p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setActiveCall({ video: false })} className="btn-secondary !p-2" title="Audio call"><Phone size={15} /></button>
                  <button onClick={() => setActiveCall({ video: true })} className="btn-secondary !p-2" title="Video call"><Video size={15} /></button>
                </div>
              </div>

              {activeCall && (
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted">{activeCall.video ? "Video call" : "Audio call"}</span>
                    <button onClick={() => setActiveCall(null)} className="text-muted hover:text-cream"><X size={15} /></button>
                  </div>
                  <CallPanel room={`conversation:${selected._id}`} video={activeCall.video} myName={user.name} onLeave={() => setActiveCall(null)} />
                </div>
              )}

              <div className="flex-1 min-h-0">
                <MessageThread room={`conversation:${selected._id}`} historyUrl={`/conversations/${selected._id}/messages`} />
              </div>
            </>
          )}
        </div>
      </div>

      <Modal open={showNewDirect} onClose={() => setShowNewDirect(false)} title="Start a conversation">
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {contacts.map((c) => (
            <button key={c._id} onClick={() => openDirect(c._id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-left transition-colors">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold">{c.name[0].toUpperCase()}</div>
              <div>
                <p className="text-sm font-medium text-cream/90">{c.name}</p>
                <p className="text-xs text-muted">{c.email}</p>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={showNewGroup} onClose={() => setShowNewGroup(false)} title="Create a group chat">
        {error && <div className="mb-4 text-sm text-accent-red bg-accent-red/15 px-3.5 py-2.5 rounded-xl">{error}</div>}
        <form onSubmit={createGroup} className="space-y-4">
          <div>
            <label className="label">Group name</label>
            <input required className="input" value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Members</label>
            <div className="space-y-1 max-h-52 overflow-y-auto">
              {contacts.map((c) => (
                <label key={c._id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer">
                  <input type="checkbox" checked={groupForm.memberIds.includes(c._id)} onChange={() => toggleGroupMember(c._id)} className="accent-cream" />
                  <span className="text-sm text-cream/90">{c.name}</span>
                </label>
              ))}
              {contacts.length === 0 && <p className="text-xs text-muted">No one available to add yet.</p>}
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? "Creating..." : "Create group"}</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Messages;
