"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  _count: {
    messages: number;
    notes: number;
  };
}

interface Message {
  id: string;
  content: string;
  channelType: string;
  direction: string;
  status: string;
  createdAt: string;
  contact: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}

export default function InboxPage() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: contactsData } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const res = await fetch("/api/contacts");
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });

  const { data: messagesData } = useQuery({
    queryKey: ["messages", selectedContact?.id],
    queryFn: async () => {
      if (!selectedContact) return { messages: [] };
      const res = await fetch(`/api/messages?contactId=${selectedContact.id}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!selectedContact,
  });

  const contacts = contactsData?.contacts || [];
  const messages = messagesData?.messages || [];

  const filteredContacts = contacts.filter((contact: Contact) => {
    const fullName = `${contact.firstName || ""} ${contact.lastName || ""}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      fullName.includes(search) ||
      contact.email?.toLowerCase().includes(search) ||
      contact.phone?.includes(search)
    );
  });

  const getContactName = (contact: Contact) => {
    if (contact.firstName || contact.lastName) {
      return `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
    }
    return contact.email || contact.phone || "Unknown Contact";
  };

  const getChannelBadgeColor = (channelType: string) => {
    switch (channelType) {
      case "SMS":
        return "bg-blue-100 text-blue-800";
      case "WHATSAPP":
        return "bg-green-100 text-green-800";
      case "EMAIL":
        return "bg-purple-100 text-purple-800";
      case "TWITTER":
        return "bg-sky-100 text-sky-800";
      case "FACEBOOK":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Contacts Sidebar */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? "No contacts found" : "No contacts yet"}
            </div>
          ) : (
            filteredContacts.map((contact: Contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full p-4 border-b hover:bg-gray-50 text-left transition-colors ${
                  selectedContact?.id === contact.id
                    ? "bg-blue-50 border-l-4 border-l-blue-600"
                    : ""
                }`}
              >
                <div className="font-medium text-gray-900">{getContactName(contact)}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {contact.email || contact.phone || ""}
                </div>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs text-gray-500">{contact._count.messages} messages</span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">{contact._count.notes} notes</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedContact ? (
          <>
            {/* Message Header */}
            <div className="bg-white border-b p-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {getContactName(selectedContact)}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedContact.email || selectedContact.phone}
              </p>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">No messages yet</div>
              ) : (
                messages.map((message: Message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-md px-4 py-2 rounded-lg ${
                        message.direction === "OUTBOUND"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-900 border"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${getChannelBadgeColor(message.channelType)}`}
                        >
                          {message.channelType}
                        </span>
                        <span
                          className={`text-xs ${message.direction === "OUTBOUND" ? "text-blue-100" : "text-gray-500"}`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Composer */}
            <div className="bg-white border-t p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a contact to view messages
          </div>
        )}
      </div>
    </div>
  );
}
