const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// =============================================
//  CONFIG
// =============================================
const BOT_TOKEN            = process.env.BOT_TOKEN;
const PREFIX               = ".";
const MM_TICKETS_CATEGORY  = "1482756353054474254";
const WARN_TICKET_CATEGORY = "1482756353054474259";
const BUY_ROLE_CATEGORY    = "1482756353054474257";
const SUPPORT_CATEGORY     = "1482756352668467235";
const INDEX_CATEGORY       = "1482767943203819682";
const TRANSCRIPTS_CHANNEL  = "1482756353960444033";
const OWNER_ROLE           = "1482756351280152676";

const ROLES = {
  TRADER:           "1482756351208984793",
  MIDDLEMAN:        "1482756351208984794",
  HEAD_MIDDLEMAN:   "1482756351208984795",
  MM_MANAGER:       "1482756351208984796",
  MODERATOR:        "1482756351263379466",
  HEAD_MODERATOR:   "1482756351263379470",
  LEAD_COORDINATOR: "1482756351263379473",
  ADMINISTRATION:   "1482756351263379474",
  CO_OWNER:         "1482756351263379475",
  OPERATIONAL_LEAD: "1482756351280152669",
  CHIEF_LEAD:       "1482756351280152670",
  TEAM_LEAD:        "1482756351280152671",
  PRESIDENT:        "1482756351280152672",
  SUPPORT_STAFF:    "1482756351208984797",
  PRINCE:           "1482756351263379468",
  PRINCESS:         "1482756351263379467",
  RECRUITER:        "1482756351263379469",
  BAN_PERMS:        "1482756351263379472",
};

// =============================================
//  ROLE HELPERS
// =============================================
const ALL_STAFF = [
  ROLES.MIDDLEMAN, ROLES.HEAD_MIDDLEMAN, ROLES.MM_MANAGER, ROLES.MODERATOR,
  ROLES.HEAD_MODERATOR, ROLES.LEAD_COORDINATOR, ROLES.ADMINISTRATION,
  ROLES.CO_OWNER, ROLES.OPERATIONAL_LEAD, ROLES.CHIEF_LEAD, ROLES.TEAM_LEAD, ROLES.PRESIDENT,
];
const MOD_ROLES = [
  ROLES.MODERATOR, ROLES.HEAD_MODERATOR, ROLES.LEAD_COORDINATOR, ROLES.ADMINISTRATION,
  ROLES.CO_OWNER, ROLES.OPERATIONAL_LEAD, ROLES.CHIEF_LEAD, ROLES.TEAM_LEAD, ROLES.PRESIDENT,
];
const WARN_ROLES = [
  ROLES.MM_MANAGER, ROLES.MODERATOR, ROLES.HEAD_MODERATOR, ROLES.LEAD_COORDINATOR,
  ROLES.ADMINISTRATION, ROLES.CO_OWNER, ROLES.OPERATIONAL_LEAD, ROLES.CHIEF_LEAD,
  ROLES.TEAM_LEAD, ROLES.PRESIDENT,
];
const REMOVE_WARN_ROLES = [
  ROLES.HEAD_MODERATOR, ROLES.LEAD_COORDINATOR, ROLES.ADMINISTRATION, ROLES.CO_OWNER,
  ROLES.OPERATIONAL_LEAD, ROLES.CHIEF_LEAD, ROLES.TEAM_LEAD, ROLES.PRESIDENT,
];

const hasStaffRole  = m => ALL_STAFF.some(r => m.roles.cache.has(r));
const hasModRole    = m => MOD_ROLES.some(r => m.roles.cache.has(r));
const hasWarnRole   = m => WARN_ROLES.some(r => m.roles.cache.has(r));

// In-memory stores
const tickets     = new Map();
const vouchData   = new Map();
const warnData    = new Map();
const blacklist   = new Set();
const vacationData = new Map();
const snipeData   = new Map(); // channelId -> { content, author, deletedAt }
let   vouchChannel = null;

const RANK_CHAIN = [
  { name: "Middleman",        id: ROLES.MIDDLEMAN },
  { name: "Head Middleman",   id: ROLES.HEAD_MIDDLEMAN },
  { name: "MM Manager",       id: ROLES.MM_MANAGER },
  { name: "Moderator",        id: ROLES.MODERATOR },
  { name: "Head Moderator",   id: ROLES.HEAD_MODERATOR },
  { name: "Lead Coordinator", id: ROLES.LEAD_COORDINATOR },
  { name: "Administration",   id: ROLES.ADMINISTRATION },
  { name: "Co-Owner",         id: ROLES.CO_OWNER },
  { name: "Operational Lead", id: ROLES.OPERATIONAL_LEAD },
  { name: "Chief Lead",       id: ROLES.CHIEF_LEAD },
  { name: "Team Lead",        id: ROLES.TEAM_LEAD },
  { name: "President",        id: ROLES.PRESIDENT },
];

const WELCOME_CHANNEL      = "1482756352265949293";
const MOD_LOG_CHANNEL      = "1482756353960444032";
const MESSAGE_LOG_CHANNEL  = "1482756354287337624";
const BAN_LOG_CHANNEL      = "1482756354287337625";
const SERVICE_CATEGORY     = "1484550850130219069";

// Anti-spam tracker
const spamMap = new Map(); // userId -> { count, timeout }

// =============================================
//  READY
// =============================================
client.once("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// =============================================
//  WELCOME
// =============================================
client.on("guildMemberAdd", async (member) => {
  const welcomeChannel = member.guild.channels.cache.get(WELCOME_CHANNEL);
  if (!welcomeChannel) return;

  const memberCount = member.guild.memberCount;
  const accountAge = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));

  const embed = new EmbedBuilder()
    .setColor(0x87CEEB)
    .setTitle("🌊 Welcome to the server!")
    .setDescription(
      `💙 **Hey ${member}, welcome to **${member.guild.name}**!**\n\n` +
      `✨ We're so happy to have you here.\n` +
      `🫧 Take a moment to read the rules and make yourself at home.\n` +
      `💫 Don't hesitate to reach out if you need anything!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🌸 **We hope you enjoy your stay!**`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setImage("https://cdn.discordapp.com/attachments/1482756353431834786/1483855733731754074/ChatGPT_Image_12_mars_2026_16_19_53.png?ex=69bc1bd7&is=69baca57&hm=334fd1df8c089d09c3c1c9d2b36802b1cce7604864664d793c7389dad727b5d4&")
    .addFields(
      { name: "👤 Member",         value: `${member}`,                                                    inline: true },
      { name: "🔢 Member Count",   value: `#${memberCount}`,                                             inline: true },
      { name: "📅 Account Age",    value: `${accountAge} days old`,                                      inline: true },
      { name: "🎂 Joined Discord", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,    inline: true },
    )
    .setFooter({ text: `⚡ Powered by Titam Helper • ${member.guild.name}` })
    .setTimestamp();

  await welcomeChannel.send({ content: `💙 Welcome ${member}!`, embeds: [embed] });
});

// =============================================
//  SNIPE — track deleted messages
// =============================================
client.on("messageDelete", (message) => {
  if (message.author?.bot) return;
  snipeData.set(message.channel.id, {
    content: message.content,
    author: message.author,
    deletedAt: Date.now(),
  });
});

// =============================================
//  SNIPE — track deleted messages
// =============================================
client.on("messageDelete", (message) => {
  if (message.author?.bot) return;
  if (!message.content) return;
  snipeData.set(message.channel.id, {
    content: message.content,
    author: message.author,
    deletedAt: Date.now(),
  });
});

// =============================================
//  MESSAGE LOGGING
// =============================================
client.on("messageDelete", async (message) => {
  if (message.author?.bot) return;
  const logChannel = message.guild?.channels.cache.get(MESSAGE_LOG_CHANNEL);
  if (!logChannel) return;
  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle("🗑️ Message Deleted")
    .setThumbnail(message.author?.displayAvatarURL({ dynamic: true }) || null)
    .addFields(
      { name: "Author",  value: `${message.author?.tag || "Unknown"} (${message.author?.id || "?"})`, inline: true },
      { name: "Channel", value: `${message.channel}`,                                                  inline: true },
      { name: "Content", value: message.content || "*No text content*",                                inline: false },
    )
    .setFooter({ text: "⚡ Powered by Titam Helper" })
    .setTimestamp();
  await logChannel.send({ embeds: [embed] });
});

client.on("messageUpdate", async (oldMessage, newMessage) => {
  if (oldMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;
  const logChannel = oldMessage.guild?.channels.cache.get(MESSAGE_LOG_CHANNEL);
  if (!logChannel) return;
  const embed = new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle("✏️ Message Edited")
    .setThumbnail(oldMessage.author?.displayAvatarURL({ dynamic: true }) || null)
    .addFields(
      { name: "Author",      value: `${oldMessage.author?.tag || "Unknown"}`, inline: true },
      { name: "Channel",     value: `${oldMessage.channel}`,                  inline: true },
      { name: "Before",      value: oldMessage.content || "*Empty*",           inline: false },
      { name: "After",       value: newMessage.content || "*Empty*",           inline: false },
    )
    .setFooter({ text: "⚡ Powered by Titam Helper" })
    .setTimestamp();
  await logChannel.send({ embeds: [embed] });
});

// =============================================
//  MESSAGES
// =============================================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // ── ANTI INVITE LINK ──────────────────────
  const inviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[a-zA-Z0-9]+/gi;
  if (inviteRegex.test(message.content)) {
    await message.delete().catch(() => {});
    const warn = await message.channel.send(`❌ ${message.author} Server invite links are not allowed here!`);
    setTimeout(() => warn.delete().catch(() => {}), 5000);
    return;
  }

  // ── ANTI SPAM ─────────────────────────────
  if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
    const userId = message.author.id;
    const now = Date.now();
    if (!spamMap.has(userId)) {
      spamMap.set(userId, { count: 1, firstMessage: now });
    } else {
      const data = spamMap.get(userId);
      if (now - data.firstMessage < 3000) {
        data.count++;
        if (data.count >= 5) {
          spamMap.delete(userId);
          await message.member.timeout(5 * 60 * 1000).catch(() => {});
          const spamMsg = await message.channel.send(`🔇 ${message.author} has been muted for **5 minutes** for spamming.`);
          setTimeout(() => spamMsg.delete().catch(() => {}), 5000);
          return;
        }
        spamMap.set(userId, data);
      } else {
        spamMap.set(userId, { count: 1, firstMessage: now });
      }
    }
  }

  if (!message.content.startsWith(PREFIX)) return;

  const args   = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd    = args.shift().toLowerCase();
  const guild  = message.guild;
  const member = message.member;

  // ── .help ─────────────────────────────────
  if (cmd === "help") {
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle("⚡ Powered by Titam Helper — Command List")
      .addFields(
        {
          name: "📌 General",
          value: [
            "`.w [@user]` — User info",
            "`.av [@user]` — Avatar",
            "`.serverinfo` — Server stats",
            "`.ping` — Bot latency",
            "`.botinfo` — Bot information",
            "`.botinfo` — Bot information",
            "`.rules` — Server rules",
            "`.perks` — Role perks & prices",
            "`.myrole` — Your role info",
            "`.vouch @user [comment]` — Vouch someone",
            "`.vouches [@user]` — Check vouches",
            "`.afk [reason]` — Set AFK",
            "`.membercount` — Member count",
            "`.vacation` — Toggle vacation mode",
            "`.mm1` — MM info type 1",
            "`.mm2` — MM info type 2",
            "`.snipe` — Show last deleted message",
            "`.remind <time> <msg>` — Set a reminder",
            "`.coinflip` — Flip a coin",
            "`.8ball <question>` — Magic 8-ball",
            "`.poll <question>` — Create a poll (Admin)",
            "`.nick @user <name>` — Change nickname (Admin)",
            "`.lookup <userID>` — Look up a user (Admin)",
          ].join("\n"),
        },
        {
          name: "👑 Staff Management (Owner)",
          value: [
            "`.stafflist` — Show all staff by role",
            "`.inactive @user` — Mark as inactive",
            "`.trial @user` — Start trial period",
          ].join("\n"),
        },
        {
          name: "🎟️ Ticket Tools",
          value: [
            "`.adduser @user` — Add to ticket",
            "`.remove @user` — Remove from ticket",
            "`.claim` — Claim ticket",
            "`.unclaim` — Unclaim ticket",
            "`.close` — Close ticket",
            "`.fee <amount>` — Set MM fee",
            "`.confirm @user1 @user2` — Trade confirm",
            "`.titamthatnigga @user` — Send mercy (ticket only)",
            "`.transfer @user` — Transfer ticket",
            "`.rename <name>` — Rename ticket (MM+)",
            "`.addnote <text>` — Add staff note (Owner)",
            "`.ticketstats` — Ticket statistics (Owner)",
          ].join("\n"),
        },
        {
          name: "🛡️ Moderation",
          value: [
            "`.warn @user [reason]` — Warn (MM Manager+)",
            "`.warns [@user]` — View warnings",
            "`.removewarn @user` — Remove warn (Head Mod+)",
            "`.clearwarns @user` — Clear warns (President)",
            "`.mute @user <time>` — Mute (Moderator+)",
            "`.unmute @user` — Unmute (Moderator+)",
            "`.ban @user [reason]` — Ban (Ban Perms)",
            "`.unban <ID>` — Unban by ID",
            "`.kick @user [reason]` — Kick (Mod+)",
            "`.purge <amount>` — Bulk delete (Mod+)",
            "`.promote @user` — Promote one rank",
            "`.demote @user` — Demote one rank",
            "`.addrole @user <role>` — Give role",
            "`.blacklist @user [reason]` — Blacklist",
            "`.unblacklist @user` — Unblacklist",
            "`.say <message>` — Bot sends message",
            "`.dm @role <message>` — DM role members",
            "`.steal <emoji>` — Steal emoji",
            "`.reset` — Reset channel",
            "`.lock` — Lock channel (Mod+)",
            "`.unlock` — Unlock channel (Mod+)",
            "`.nick @user <n>` — Change nickname (Owner)",
            "`.poll <question>` — Create poll (Owner)",
            "`.lookup <ID>` — Look up user (Owner)",
            "`.giveaway <time> <prize>` — Giveaway (Mod+)",
          ].join("\n"),
        },
        {
          name: "🎮 Fun",
          value: [
            "`.snipe` — Show last deleted message",
            "`.remind <time> <msg>` — Set a reminder",
            "`.coinflip` — Flip a coin",
            "`.8ball <question>` — Magic 8 ball",
          ].join("\n"),
        },
        {
          name: "📊 Staff Data",
          value: [
            "`.setvouches @user <n>` — Set vouches",
            "`.setvouchchannel #ch` — Set vouch channel",
          ].join("\n"),
        },
        {
          name: "🎮 Fun (Everyone)",
          value: [
            "`.coinflip` / `.toss` — Flip a coin",
            "`.8ball <question>` — Magic 8ball",
            "`.rate [@user]` — Rate someone",
            "`.ship @user1 @user2` — Ship two users",
            "`.dih [@user]` — Dih size",
            "`.puh [@user]` — How pink is ur pussy",
            "`.bitches [@user]` — How many bitches",
            "`.iq` `.simp` `.gay` `.virgin` `.sus` `.rizz` `.broke` `.wanted` `.skill` `.bodycount`",
            "`.horny` `.daddy` `.freak` `.thirst` `.submissive` `.dominant` `.fuckable` `.onlyfans`",
            "`.poll <question>` — Create a poll",
          ].join("\n"),
        },
        {
          name: "🔒 Security (Owner)",
          value: [
            "`.alts @user` — Check if account is suspicious",
            "`.accountage [@user]` — Account creation date",
            "`.newaccounts` — List new accounts under 7 days",
          ].join("\n"),
        },
        {
          name: "👑 Admin Panels",
          value: [
            "`.ticketpanel` — MM ticket panel",
            "`.supportpanel` — Support panel",
            "`.warnpanel` — Warn removal panel",
            "`.buypanel` — Buy role panel",
            "`.indexpanel` — Index service panel",
            "`.faq` — Send FAQ embed",
            "`.servicepanel` — Send bot service panel",
            "`.announce #ch <msg>` — Announcement",
          ].join("\n"),
        }
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .ping ─────────────────────────────────
  if (cmd === "ping") {
    const sent = await message.channel.send("Pinging...");
    return sent.edit(`🏓 Pong! Latency: **${sent.createdTimestamp - message.createdTimestamp}ms** | API: **${client.ws.ping}ms**`);
  }

  // ── .botinfo ──────────────────────────────
  if (cmd === "botinfo") {
    const uptime = process.uptime();
    const days    = Math.floor(uptime / 86400);
    const hours   = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle("🤖 Bot Info")
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Bot Name",   value: client.user.tag,               inline: true },
        { name: "Servers",    value: `${client.guilds.cache.size}`,  inline: true },
        { name: "Uptime",     value: uptimeStr,                      inline: true },
        { name: "Ping",       value: `${client.ws.ping}ms`,          inline: true },
        { name: "Users",      value: `${client.users.cache.size}`,   inline: true },
        { name: "Commands",   value: "50+",                          inline: true },
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .botinfo ──────────────────────────────
  if (cmd === "botinfo") {
    const uptime = process.uptime();
    const days    = Math.floor(uptime / 86400);
    const hours   = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle("🤖 Bot Info")
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Name",       value: client.user.tag,                     inline: true },
        { name: "ID",         value: client.user.id,                      inline: true },
        { name: "Servers",    value: `${client.guilds.cache.size}`,        inline: true },
        { name: "Users",      value: `${client.users.cache.size}`,         inline: true },
        { name: "Uptime",     value: uptimeStr,                            inline: true },
        { name: "Ping",       value: `${client.ws.ping}ms`,               inline: true },
        { name: "Library",    value: "discord.js v14",                     inline: true },
        { name: "Node.js",    value: process.version,                      inline: true },
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .botinfo ──────────────────────────────
  if (cmd === "botinfo") {
    const uptimeSeconds = Math.floor(process.uptime());
    const days    = Math.floor(uptimeSeconds / 86400);
    const hours   = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    const uptime  = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle("🤖 Bot Info")
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Name",      value: client.user.tag,              inline: true },
        { name: "Servers",   value: `${client.guilds.cache.size}`, inline: true },
        { name: "Users",     value: `${client.users.cache.size}`,  inline: true },
        { name: "Uptime",    value: uptime,                        inline: true },
        { name: "Ping",      value: `${client.ws.ping}ms`,         inline: true },
        { name: "Prefix",    value: PREFIX,                        inline: true },
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .membercount ──────────────────────────
  if (cmd === "membercount") {
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle("👥 Member Count")
      .setDescription(`**${guild.memberCount}** members`)
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .w ────────────────────────────────────
  if (cmd === "w") {
    const target = message.mentions.members.first() || member;
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle(`User Info — ${target.user.tag}`)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "ID",              value: target.user.id,                                              inline: true },
        { name: "Joined Server",   value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`,        inline: true },
        { name: "Account Created", value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`,  inline: true },
        { name: "Roles",           value: target.roles.cache.filter(r => r.id !== guild.roles.everyone.id).map(r => r.toString()).join(", ") || "None", inline: false },
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .av ───────────────────────────────────
  if (cmd === "av") {
    const target = message.mentions.users.first() || message.author;
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle(`Avatar — ${target.tag}`)
      .setImage(target.displayAvatarURL({ dynamic: true, size: 512 }))
      .setFooter({ text: "⚡ Powered by Titam Helper" });
    return message.channel.send({ embeds: [embed] });
  }

  // ── .serverinfo ───────────────────────────
  if (cmd === "serverinfo") {
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle(`Server Info — ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: "Members",  value: `${guild.memberCount}`,                               inline: true },
        { name: "Created",  value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "Owner",    value: `<@${guild.ownerId}>`,                                inline: true },
        { name: "Channels", value: `${guild.channels.cache.size}`,                      inline: true },
        { name: "Roles",    value: `${guild.roles.cache.size}`,                         inline: true },
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .rules ────────────────────────────────
  if (cmd === "rules") {
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle("📜 Server Rules")
      .setImage("https://i.imgur.com/9NUe44l.png")
      .addFields(
        { name: "1️⃣ Be Respectful",                    value: "Treat everyone with kindness.",              inline: false },
        { name: "2️⃣ No NSFW or Inappropriate Content", value: "Keep things clean.",                        inline: false },
        { name: "3️⃣ Use Common Sense",                  value: "Don't look for loopholes.",                 inline: false },
        { name: "4️⃣ No Spam or Self-Promo",             value: "No advertising or spam.",                   inline: false },
        { name: "5️⃣ Respect Privacy",                   value: "Don't leak private info.",                  inline: false },
        { name: "6️⃣ Follow Staff Instructions",         value: "Respect all staff.",                        inline: false },
        { name: "7️⃣ No Unapproved Bots or Exploits",   value: "Don't use unauthorized bots.",              inline: false },
        { name: "8️⃣ Stay in the Right Channels",        value: "Use channels appropriately.",               inline: false },
        { name: "⚠️ Consequences",                      value: "Breaking rules may result in warnings, mutes, or bans.", inline: false },
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .afk ──────────────────────────────────
  if (cmd === "afk") {
    const reason = args.join(" ") || "No reason provided";
    return message.reply(`You are now AFK: **${reason}**`);
  }

  // ── .perks ────────────────────────────────
  if (cmd === "perks") {
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle("🏆 Role Perks & Prices")
      .setDescription("*(Discount applies if you already own the previous rank)*")
      .addFields(
        { name: "🟢 Middleman",        value: "🎯 **15 h1ts** OR 💵 **$10**\n✅ Handle tickets, see transcripts\n🎖️ Sold by: **Co-Owner**",                                                                              inline: false },
        { name: "🟢 Head Middleman",   value: "🎯 **5 alt h1ts** OR 💵 **$20** *($10 with Middleman)*\n✅ Handle tickets, transcripts, delete vouches\n🎖️ Sold by: **Operational Lead**",                              inline: false },
        { name: "🔵 MM Manager",       value: "🎯 **15 alt h1ts** OR 💵 **$25** *($10 with Head MM)*\n✅ Handle tickets, transcripts, delete vouches, warn\n🎖️ Sold by: **Chief Lead**",                               inline: false },
        { name: "🔵 Moderator",        value: "💵 **$40** *($10 with MM Manager)*\n✅ Handle tickets, warn, timeout, remove timeouts\n🎖️ Sold by: **Team Lead**",                                                       inline: false },
        { name: "🟡 Head Moderator",   value: "💵 **$55** *($15 with Moderator)*\n✅ All above + remove warns\n🎖️ Sold by: **President**",                                                                              inline: false },
        { name: "🟡 Lead Coordinator", value: "💵 **$70** *($15 with Head Mod)*\n✅ All above + handle 2 tickets at a time\n🎖️ Sold by: **President**",                                                                inline: false },
        { name: "🟠 Administration",   value: "💵 **$80** *($20 with Lead Coordinator)*\n✅ All above + demote/promote Middleman\n🎖️ Sold by: **President**",                                                          inline: false },
        { name: "🟠 Co-Owner",         value: "💵 **$140** *($50 with Administration)* | 0/5\n✅ All above + sell Middleman role",                                                                                      inline: false },
        { name: "🔴 Operational Lead", value: "💵 **$180** *($60 with Co-Owner)* | 0/5\n✅ All above + sell warns, sell Head MM role",                                                                                  inline: false },
        { name: "🔴 Chief Lead",       value: "💵 **$250** *($70 with Ops Lead)* | 0/4\n✅ All above + sell MM Manager role",                                                                                           inline: false },
        { name: "🟣 Team Lead",        value: "💵 **$400** *($150 with Chief Lead)* | 0/10\n✅ All above + sell Moderator, sell special roles",                                                                         inline: false },
        { name: "🟣 President",        value: "💵 **$600** *($200 with Team Lead)* | 1/1\n✅ All above + announce, advertise, sell Head Mod, Lead Coordinator, Ban Perms",                                              inline: false },
        { name: "━━━━━━ Special Roles ━━━━━━", value: "\u200b",                                                                                                                                                         inline: false },
        { name: "🎫 Support Staff",    value: "💵 **$5** or handle support tickets consistently\n🎖️ Sold by: **Team Lead+**",                                                                                           inline: false },
        { name: "👑 Prince",           value: "💵 **$5**\n🎖️ Sold by: **Team Lead+**",                                                                                                                                 inline: false },
        { name: "👑 Princess",         value: "💵 **$5**\n🎖️ Sold by: **Team Lead+**",                                                                                                                                 inline: false },
        { name: "📢 Recruiter",        value: "💵 **$5**\n🎖️ Sold by: **Team Lead+**",                                                                                                                                 inline: false },
        { name: "🔨 Ban Perms",        value: "💵 **$20** — Can ban members\n🎖️ Sold by: **President**",                                                                                                               inline: false },
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .myrole ───────────────────────────────
  if (cmd === "myrole") {
    const prices = [10, 20, 25, 40, 55, 70, 80, 140, 180, 250, 400, 600];
    const discounts = [null, 10, 10, 10, 15, 15, 20, 50, 60, 70, 150, 200];

    const userRoles = RANK_CHAIN.filter(r => member.roles.cache.has(r.id));
    if (userRoles.length === 0) return message.reply("❌ You don't have any staff role yet.");

    const highest = userRoles[userRoles.length - 1];
    const highestIndex = RANK_CHAIN.findIndex(r => r.id === highest.id);
    const nextRank = RANK_CHAIN[highestIndex + 1];
    const nextPrice = nextRank ? prices[highestIndex + 1] : null;
    const nextDiscount = nextRank ? discounts[highestIndex + 1] : null;

    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle(`🏅 Your Role — ${highest.name}`)
      .addFields(
        { name: "💵 Role Price",  value: `$${prices[highestIndex]}`,  inline: true },
        { name: "⬆️ Next Rank",   value: nextRank ? `${nextRank.name} — $${nextPrice} *($${nextDiscount} with your rank)*` : "You are at the top!", inline: false },
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .vouch ────────────────────────────────
  if (cmd === "vouch") {
    const target = message.mentions.users.first();
    if (!target) return message.reply("Usage: `.vouch @user [comment]`");
    if (target.id === message.author.id) return message.reply("❌ You cannot vouch yourself.");
    const comment = args.slice(1).join(" ") || "No comment";
    const current = vouchData.get(target.id) || 0;
    vouchData.set(target.id, current + 1);
    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("✅ Vouch Added")
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: "User",    value: `${target}`,         inline: true },
        { name: "Vouches", value: `${current + 1}`,    inline: true },
        { name: "Comment", value: comment,              inline: false },
        { name: "By",      value: `${message.author}`, inline: true },
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    if (vouchChannel) {
      const ch = guild.channels.cache.get(vouchChannel);
      if (ch) await ch.send({ embeds: [embed] });
    }
    return message.channel.send({ embeds: [embed] });
  }

  // ── .vouches ──────────────────────────────
  if (cmd === "vouches") {
    const target = message.mentions.users.first() || message.author;
    const count = vouchData.get(target.id) || 0;
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle("⭐ Vouch Count")
      .addFields(
        { name: "User",    value: `${target}`, inline: true },
        { name: "Vouches", value: `${count}`,  inline: true },
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .setvouches ───────────────────────────
  if (cmd === "setvouches") {
    if (!hasStaffRole(member)) return message.reply("❌ No permission.");
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);
    if (!target || isNaN(amount)) return message.reply("Usage: `.setvouches @user <amount>`");
    vouchData.set(target.id, amount);
    return message.channel.send(`Set vouches for ${target} to **${amount}**.`);
  }

  // ── .setvouchchannel ──────────────────────
  if (cmd === "setvouchchannel") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ Admin only.");
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply("Usage: `.setvouchchannel #channel`");
    vouchChannel = ch.id;
    return message.channel.send(`✅ Vouch channel set to ${ch}.`);
  }

  // ── .vacation ─────────────────────────────
  if (cmd === "vacation") {
    if (!hasStaffRole(member)) return message.reply("❌ No permission.");
    if (vacationData.has(member.id)) {
      const savedRoles = vacationData.get(member.id);
      for (const roleId of savedRoles) {
        const role = guild.roles.cache.get(roleId);
        if (role) await member.roles.add(role).catch(() => {});
      }
      vacationData.delete(member.id);
      const embed = new EmbedBuilder()
        .setColor(0x57f287).setTitle("✅ Welcome Back!")
        .setDescription(`${member} your roles have been restored.`)
        .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
      return message.channel.send({ embeds: [embed] });
    } else {
      const staffRoleIds = ALL_STAFF.filter(r => member.roles.cache.has(r));
      vacationData.set(member.id, staffRoleIds);
      for (const roleId of staffRoleIds) {
        const role = guild.roles.cache.get(roleId);
        if (role) await member.roles.remove(role).catch(() => {});
      }
      const embed = new EmbedBuilder()
        .setColor(0x87CEEB).setTitle("🌴 Vacation Mode")
        .setDescription(`${member} your roles have been saved and removed.\n\nRun \`.vacation\` again when you're back!`)
        .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
      return message.channel.send({ embeds: [embed] });
    }
  }

  // ── .claim ────────────────────────────────
  if (cmd === "claim") {
    if (!hasStaffRole(member)) return message.reply("❌ No permission.");
    const ticket = tickets.get(message.channel.id);
    if (!ticket) return message.reply("❌ Not a ticket channel.");
    if (ticket.claimer) return message.reply("❌ Already claimed.");
    ticket.claimer = member.id;
    const embed = new EmbedBuilder().setColor(0x57f287).setTitle("✅ Ticket Claimed")
      .setDescription(`Claimed by ${member}.`).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .unclaim ──────────────────────────────
  if (cmd === "unclaim") {
    if (!hasStaffRole(member)) return message.reply("❌ No permission.");
    const ticket = tickets.get(message.channel.id);
    if (!ticket) return message.reply("❌ Not a ticket channel.");
    if (!ticket.claimer) return message.reply("❌ Not claimed.");
    ticket.claimer = null;
    const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("Ticket Unclaimed")
      .setDescription(`${member} unclaimed this ticket.`).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .adduser ──────────────────────────────
  if (cmd === "adduser") {
    if (!hasStaffRole(member)) return message.reply("❌ No permission.");
    const ticket = tickets.get(message.channel.id);
    if (!ticket) return message.reply("❌ Not a ticket channel.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Please mention a user.");
    await message.channel.permissionOverwrites.edit(target, { ViewChannel: true, SendMessages: true });
    return message.channel.send(`${target} has been added.`);
  }

  // ── .remove ───────────────────────────────
  if (cmd === "remove") {
    if (!hasStaffRole(member)) return message.reply("❌ No permission.");
    const ticket = tickets.get(message.channel.id);
    if (!ticket) return message.reply("❌ Not a ticket channel.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Please mention a user.");
    await message.channel.permissionOverwrites.edit(target, { ViewChannel: false });
    return message.channel.send(`${target} has been removed.`);
  }

  // ── .fee ──────────────────────────────────
  if (cmd === "fee") {
    if (!hasStaffRole(member)) return message.reply("❌ No permission.");
    const ticket = tickets.get(message.channel.id);
    if (!ticket) return message.reply("❌ Not a ticket channel.");
    const amount = args[0];
    if (!amount) return message.reply("Usage: `.fee <amount>`");
    const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("MM Fee Set")
      .setDescription(`Fee set to **${amount}**.`).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .confirm ──────────────────────────────
  if (cmd === "confirm") {
    const ticket = tickets.get(message.channel.id);
    if (!ticket) return message.reply("❌ Ticket only.");
    const mentioned = [...message.mentions.users.values()];
    if (mentioned.length < 2) return message.reply("Usage: `.confirm @user1 @user2`");
    const [u1, u2] = mentioned;
    ticket.confirmed = new Set();
    const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("Trade Confirmation")
      .setDescription(`${u1} and ${u2} — confirm below.`).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`confirm_yes_${u1.id}_${u2.id}`).setLabel("Confirm").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`confirm_no_${u1.id}_${u2.id}`).setLabel("Decline").setStyle(ButtonStyle.Danger),
    );
    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // ── .transfer ─────────────────────────────
  if (cmd === "transfer") {
    if (!hasStaffRole(member)) return message.reply("❌ No permission.");
    const ticket = tickets.get(message.channel.id);
    if (!ticket) return message.reply("❌ Not a ticket channel.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Usage: `.transfer @mm`");
    if (!hasStaffRole(target)) return message.reply("❌ Target must have a staff role.");
    await message.channel.permissionOverwrites.edit(target, { ViewChannel: true, SendMessages: true });
    ticket.claimer = target.id;
    const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("🔄 Ticket Transferred")
      .setDescription(`Transferred to ${target}.`).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .close ────────────────────────────────
  if (cmd === "close") {
    if (!hasStaffRole(member)) return message.reply("❌ No permission.");
    const ticket = tickets.get(message.channel.id);
    if (!ticket) return message.reply("❌ Not a ticket channel.");
    ticket.closedBy = member.id;
    const transcriptCh = guild.channels.cache.get(TRANSCRIPTS_CHANNEL);
    if (transcriptCh) {
      const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("📋 Ticket Transcript")
        .addFields(
          { name: "Ticket",    value: message.channel.name,                                   inline: true },
          { name: "Creator",   value: `<@${ticket.creator}>`,                                 inline: true },
          { name: "Claimed By",value: ticket.claimer ? `<@${ticket.claimer}>` : "Unclaimed",  inline: true },
          { name: "Closed By", value: `<@${ticket.closedBy}>`,                                inline: true },
          { name: "Closed At", value: `<t:${Math.floor(Date.now() / 1000)}:F>`,               inline: true },
        ).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
      await transcriptCh.send({ embeds: [embed] });
    }
    await message.channel.send("🔒 Closing in 5 seconds...");
    setTimeout(() => message.channel.delete().catch(() => {}), 5000);
    tickets.delete(message.channel.id);
    return;
  }

  // ── .mercy ────────────────────────────────
  if (cmd === "titamthatnigga") {
    if (!hasStaffRole(member)) return message.reply("❌ No permission.");
    const ticket = tickets.get(message.channel.id);
    if (!ticket) return message.reply("❌ Ticket only.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Usage: `.titamthatnigga @user`");

    const embed1 = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle("Scam Notification")
      .setDescription(
        `If you're seeing this, you've likely just been scammed – but this doesn't end how you think.\n\n` +
        `Most people in this server started out the same way. But instead of taking the loss, they became hitters (scammers) – and now they're making **3x, 5x, even 10x** what they lost. It takes courage to turn a setback into serious profit.\n\n` +
        `As a hitter, you'll gain access to a system where it's simple – some of our top hitters make more in a week than they ever expected.\n\n` +
        `You now have access to staff chat. Head to the staff channel to learn how to start. Everything you want is profit missed.\n\n` +
        `Need help getting started? Ask in the staff channel. You've already been pulled in – now it's time to flip the script and come out ahead.`
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" });

    const embed2 = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setDescription(
        `${target}, do you want to accept this opportunity and become a hitter?\n\n` +
        `You have **1 minute** to respond.\n` +
        `**The decision is yours. Make it count.**`
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`mercy_yes_${target.id}`).setLabel("Accept").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`mercy_no_${target.id}`).setLabel("Decline").setStyle(ButtonStyle.Danger),
    );

    await message.channel.send({ content: `${target}`, embeds: [embed1] });
    await message.channel.send({ embeds: [embed2], components: [row] });
    return;
  }

  // ── MODERATION ────────────────────────────

  if (cmd === "warn") {
    if (!hasWarnRole(member)) return message.reply("❌ You need MM Manager or above.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Please mention a user.");
    const reason = args.slice(1).join(" ") || "No reason provided";
    const current = warnData.get(target.id) || 0;
    warnData.set(target.id, current + 1);
    const dmEmbed = new EmbedBuilder().setColor(0xffa500).setTitle("⚠️ You have been warned")
      .addFields(
        { name: "Server",  value: guild.name,   inline: true },
        { name: "Reason",  value: reason,        inline: true },
        { name: "By",      value: member.user.tag, inline: true },
        { name: "Total Warns", value: `${current + 1}`, inline: true },
      ).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    await target.send({ embeds: [dmEmbed] }).catch(() => {});
    const embed = new EmbedBuilder().setColor(0xffa500).setTitle("⚠️ Warning Issued")
      .addFields(
        { name: "User",   value: `${target}`,      inline: true },
        { name: "Warns",  value: `${current + 1}`, inline: true },
        { name: "Reason", value: reason,            inline: true },
        { name: "By",     value: `${member}`,       inline: true },
      ).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    await message.channel.send({ embeds: [embed] });
    // Log to mod log
    const modLog = guild.channels.cache.get(MOD_LOG_CHANNEL);
    if (modLog) {
      const logEmbed = new EmbedBuilder().setColor(0xffa500).setTitle("⚠️ Member Warned")
        .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "User",   value: `${target.user.tag} (${target.id})`, inline: true },
          { name: "Warns",  value: `${current + 1}`,                    inline: true },
          { name: "Reason", value: reason,                               inline: true },
          { name: "By",     value: `${member.user.tag}`,                 inline: true },
        ).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
      await modLog.send({ embeds: [logEmbed] });
    }
    return;
  }

  if (cmd === "warns") {
    const target = message.mentions.users.first() || message.author;
    const count = warnData.get(target.id) || 0;
    const embed = new EmbedBuilder().setColor(0xffa500).setTitle("⚠️ Warnings")
      .addFields({ name: "User", value: `${target}`, inline: true }, { name: "Warns", value: `${count}`, inline: true })
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "removewarn") {
    if (!REMOVE_WARN_ROLES.some(r => member.roles.cache.has(r))) return message.reply("❌ You need Head Moderator or above.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Usage: `.removewarn @user`");
    const current = warnData.get(target.id) || 0;
    if (current <= 0) return message.reply("❌ No warns.");
    warnData.set(target.id, current - 1);
    const embed = new EmbedBuilder().setColor(0x57f287).setTitle("✅ Warning Removed")
      .addFields(
        { name: "User",       value: `${target}`,      inline: true },
        { name: "Warns Left", value: `${current - 1}`, inline: true },
        { name: "By",         value: `${member}`,      inline: true },
      ).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "clearwarns") {
    if (!member.roles.cache.has(ROLES.PRESIDENT)) return message.reply("❌ President only.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Usage: `.clearwarns @user`");
    warnData.delete(target.id);
    const embed = new EmbedBuilder().setColor(0x57f287).setTitle("🗑️ Warns Cleared")
      .addFields({ name: "User", value: `${target}`, inline: true }, { name: "By", value: `${member}`, inline: true })
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "mute") {
    if (!hasModRole(member)) return message.reply("❌ You need Moderator or above.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Usage: `.mute @user <time>` — Example: `5s`, `5m`, `5h`, `5d` (max 14d)");
    const timeStr = args[1];
    if (!timeStr) return message.reply("Provide a duration. Example: `5s`, `10m`, `2h`, `1d` (max 14d)");
    const timeMatch = timeStr.match(/^(\d+)(s|m|h|d)$/);
    if (!timeMatch) return message.reply("❌ Invalid format. Use `5s`, `10m`, `2h`, `1d` (max 14d)");
    const amount = parseInt(timeMatch[1]);
    const unit = timeMatch[2];
    const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
    const duration = amount * multipliers[unit];
    const maxDuration = 14 * 24 * 60 * 60 * 1000;
    if (duration > maxDuration) return message.reply("❌ Maximum mute duration is **14 days**.");
    if (target.id === guild.ownerId) return message.reply("❌ Cannot mute the server owner.");
    await target.timeout(duration).catch(() => {});
    const unitNames = { s: "second(s)", m: "minute(s)", h: "hour(s)", d: "day(s)" };
    const dmEmbed = new EmbedBuilder().setColor(0xffa500).setTitle("🔇 You have been muted")
      .addFields(
        { name: "Server",   value: guild.name,                        inline: true },
        { name: "Duration", value: `${amount} ${unitNames[unit]}`,    inline: true },
        { name: "By",       value: member.user.tag,                   inline: true },
        { name: "Unmuted",  value: `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`, inline: true },
      ).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    await target.send({ embeds: [dmEmbed] }).catch(() => {});
    const embed = new EmbedBuilder().setColor(0xffa500).setTitle("🔇 User Muted")
      .addFields(
        { name: "User",     value: target.user.tag,                    inline: true },
        { name: "Duration", value: `${amount} ${unitNames[unit]}`,     inline: true },
        { name: "By",       value: `${member}`,                        inline: true },
        { name: "Unmuted",  value: `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`, inline: true },
      ).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    await message.channel.send({ embeds: [embed] });
    const modLog = guild.channels.cache.get(MOD_LOG_CHANNEL);
    if (modLog) {
      const logEmbed = new EmbedBuilder().setColor(0xffa500).setTitle("🔇 Member Muted")
        .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "User",     value: `${target.user.tag} (${target.id})`,              inline: true },
          { name: "Duration", value: `${amount} ${unitNames[unit]}`,                   inline: true },
          { name: "By",       value: `${member.user.tag}`,                             inline: true },
          { name: "Unmuted",  value: `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`, inline: true },
        ).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
      await modLog.send({ embeds: [logEmbed] });
    }
    return;
  }

  if (cmd === "unmute") {
    if (!hasModRole(member)) return message.reply("❌ You need Moderator or above.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Usage: `.unmute @user`");
    await target.timeout(null).catch(() => {});
    const embed = new EmbedBuilder().setColor(0x57f287).setTitle("🔊 User Unmuted")
      .addFields({ name: "User", value: target.user.tag, inline: true }, { name: "By", value: `${member}`, inline: true })
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "ban") {
    if (!member.roles.cache.has(ROLES.BAN_PERMS) && !member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ You need the Ban Perms role.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Please mention a user.");
    const reason = args.slice(1).join(" ") || "No reason provided";
    const dmBanEmbed = new EmbedBuilder().setColor(0xff0000).setTitle("🔨 You have been banned")
      .addFields(
        { name: "Server", value: guild.name,       inline: true },
        { name: "Reason", value: reason,            inline: true },
        { name: "By",     value: member.user.tag,   inline: true },
      ).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    await target.send({ embeds: [dmBanEmbed] }).catch(() => {});
    await target.ban({ reason }).catch(() => {});
    const embed = new EmbedBuilder().setColor(0xff0000).setTitle("🔨 User Banned")
      .addFields({ name: "User", value: target.user.tag, inline: true }, { name: "Reason", value: reason, inline: true }, { name: "By", value: `${member}`, inline: true })
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    await message.channel.send({ embeds: [embed] });
    const banLog = guild.channels.cache.get(BAN_LOG_CHANNEL);
    if (banLog) {
      const logEmbed = new EmbedBuilder().setColor(0xff0000).setTitle("🔨 Member Banned")
        .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "User",   value: `${target.user.tag} (${target.id})`, inline: true },
          { name: "Reason", value: reason,                               inline: true },
          { name: "By",     value: `${member.user.tag}`,                 inline: true },
        ).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
      await banLog.send({ embeds: [logEmbed] });
    }
    return;
  }

  if (cmd === "unban") {
    if (!member.roles.cache.has(ROLES.BAN_PERMS) && !member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ You need the Ban Perms role.");
    const userId = args[0];
    if (!userId) return message.reply("Usage: `.unban <userID>`");
    await guild.bans.remove(userId).catch(() => {});
    const embed = new EmbedBuilder().setColor(0x57f287).setTitle("✅ User Unbanned")
      .addFields({ name: "User ID", value: userId, inline: true }, { name: "By", value: `${member}`, inline: true })
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "kick") {
    if (!hasModRole(member)) return message.reply("❌ You need Moderator or above.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Please mention a user.");
    const reason = args.slice(1).join(" ") || "No reason provided";
    const dmKickEmbed = new EmbedBuilder().setColor(0xff6600).setTitle("👢 You have been kicked")
      .addFields(
        { name: "Server", value: guild.name,      inline: true },
        { name: "Reason", value: reason,           inline: true },
        { name: "By",     value: member.user.tag,  inline: true },
      ).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    await target.send({ embeds: [dmKickEmbed] }).catch(() => {});
    await target.kick(reason).catch(() => {});
    const embed = new EmbedBuilder().setColor(0xff6600).setTitle("👢 User Kicked")
      .addFields({ name: "User", value: target.user.tag, inline: true }, { name: "Reason", value: reason, inline: true }, { name: "By", value: `${member}`, inline: true })
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "purge") {
    if (!hasModRole(member)) return message.reply("❌ No permission.");
    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) return message.reply("Provide a number between 1 and 100.");
    await message.channel.bulkDelete(amount + 1, true).catch(() => {});
    const msg = await message.channel.send(`Deleted ${amount} messages.`);
    setTimeout(() => msg.delete().catch(() => {}), 3000);
    return;
  }

  if (cmd === "promote") {
    if (!hasModRole(member)) return message.reply("❌ You need Moderator or above.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Usage: `.promote @user`");
    const currentIndex = RANK_CHAIN.map((r, i) => target.roles.cache.has(r.id) ? i : -1).filter(i => i !== -1).pop() ?? -1;
    if (currentIndex === RANK_CHAIN.length - 1) return message.reply("❌ Already at highest rank.");
    const nextRole = guild.roles.cache.get(RANK_CHAIN[currentIndex + 1].id);
    if (!nextRole) return message.reply("❌ Role not found.");
    await target.roles.add(nextRole).catch(() => {});
    const embed = new EmbedBuilder().setColor(0x57f287).setTitle("⬆️ Member Promoted")
      .addFields(
        { name: "User",     value: `${target}`,                          inline: true },
        { name: "New Rank", value: RANK_CHAIN[currentIndex + 1].name,   inline: true },
        { name: "By",       value: `${member}`,                          inline: true },
      ).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "demote") {
    if (!hasModRole(member)) return message.reply("❌ You need Moderator or above.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Usage: `.demote @user`");
    const currentIndex = RANK_CHAIN.map((r, i) => target.roles.cache.has(r.id) ? i : -1).filter(i => i !== -1).pop() ?? -1;
    if (currentIndex === -1) return message.reply("❌ No MM rank found.");
    if (currentIndex === 0) return message.reply("❌ Already at lowest rank.");
    const currentRole = guild.roles.cache.get(RANK_CHAIN[currentIndex].id);
    if (currentRole) await target.roles.remove(currentRole).catch(() => {});
    const embed = new EmbedBuilder().setColor(0xed4245).setTitle("⬇️ Member Demoted")
      .addFields(
        { name: "User",     value: `${target}`,                                          inline: true },
        { name: "New Rank", value: RANK_CHAIN[currentIndex - 1]?.name || "None",        inline: true },
        { name: "By",       value: `${member}`,                                          inline: true },
      ).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "addrole") {
    const target = message.mentions.members.first();
    const roleName = args.slice(1).join(" ").toLowerCase();
    if (!target || !roleName) return message.reply("Usage: `.addrole @user <role name>`");
    const roleMap = {
      "middleman":        { id: ROLES.MIDDLEMAN,        requiredRole: ROLES.CO_OWNER },
      "head middleman":   { id: ROLES.HEAD_MIDDLEMAN,   requiredRole: ROLES.OPERATIONAL_LEAD },
      "mm manager":       { id: ROLES.MM_MANAGER,       requiredRole: ROLES.CHIEF_LEAD },
      "moderator":        { id: ROLES.MODERATOR,        requiredRole: ROLES.TEAM_LEAD },
      "head moderator":   { id: ROLES.HEAD_MODERATOR,   requiredRole: ROLES.PRESIDENT },
      "lead coordinator": { id: ROLES.LEAD_COORDINATOR, requiredRole: ROLES.PRESIDENT },
      "ban perms":        { id: ROLES.BAN_PERMS,        requiredRole: ROLES.PRESIDENT },
      "support staff":    { id: ROLES.SUPPORT_STAFF,    requiredRole: ROLES.TEAM_LEAD },
      "prince":           { id: ROLES.PRINCE,           requiredRole: ROLES.TEAM_LEAD },
      "princess":         { id: ROLES.PRINCESS,         requiredRole: ROLES.TEAM_LEAD },
      "recruiter":        { id: ROLES.RECRUITER,        requiredRole: ROLES.TEAM_LEAD },
    };
    const entry = roleMap[roleName];
    if (!entry) return message.reply(`❌ Role not found. Available: ${Object.keys(roleMap).join(", ")}`);
    if (!member.roles.cache.has(entry.requiredRole) && !member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply(`❌ You don't have permission to give **${roleName}**.`);
    if (target.roles.cache.has(entry.id)) return message.reply(`❌ ${target} already has this role.`);
    const roleToGive = guild.roles.cache.get(entry.id);
    await target.roles.add(roleToGive).catch(() => {});
    const embed = new EmbedBuilder().setColor(0x57f287).setTitle("✅ Role Given")
      .addFields({ name: "User", value: `${target}`, inline: true }, { name: "Role", value: roleToGive.toString(), inline: true }, { name: "By", value: `${member}`, inline: true })
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "blacklist") {
    if (!hasModRole(member)) return message.reply("❌ No permission.");
    const target = message.mentions.users.first();
    if (!target) return message.reply("Usage: `.blacklist @user [reason]`");
    const reason = args.slice(1).join(" ") || "No reason provided";
    blacklist.add(target.id);
    const embed = new EmbedBuilder().setColor(0xff0000).setTitle("🚫 User Blacklisted")
      .addFields({ name: "User", value: `${target}`, inline: true }, { name: "Reason", value: reason, inline: true }, { name: "By", value: `${member}`, inline: true })
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "unblacklist") {
    if (!hasModRole(member)) return message.reply("❌ No permission.");
    const target = message.mentions.users.first();
    if (!target) return message.reply("Usage: `.unblacklist @user`");
    if (!blacklist.has(target.id)) return message.reply("❌ Not blacklisted.");
    blacklist.delete(target.id);
    const embed = new EmbedBuilder().setColor(0x57f287).setTitle("✅ User Unblacklisted")
      .addFields({ name: "User", value: `${target}`, inline: true }, { name: "By", value: `${member}`, inline: true })
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "say") {
    if (!hasModRole(member)) return message.reply("❌ No permission.");
    const text = args.join(" ");
    if (!text) return message.reply("Usage: `.say <message>`");
    await message.delete().catch(() => {});
    return message.channel.send(text);
  }

  if (cmd === "dm") {
    if (!hasModRole(member)) return message.reply("❌ No permission.");
    const role = message.mentions.roles.first();
    const text = args.slice(1).join(" ");
    if (!role || !text) return message.reply("Usage: `.dm @role <message>`");
    const members = role.members;
    let sent = 0, failed = 0;
    await message.channel.send(`📨 Sending DMs to **${members.size}** members...`);
    for (const [, m] of members) {
      await m.send(text).then(() => sent++).catch(() => failed++);
    }
    return message.channel.send(`✅ Done! Sent: **${sent}** | Failed: **${failed}**`);
  }

  if (cmd === "steal") {
    if (!hasModRole(member)) return message.reply("❌ No permission.");
    const emoji = args[0];
    if (!emoji) return message.reply("Usage: `.steal <emoji>`");
    const match = emoji.match(/<a?:(\w+):(\d+)>/);
    if (!match) return message.reply("❌ Provide a custom emoji.");
    const [, name, id] = match;
    const ext = emoji.startsWith("<a:") ? "gif" : "png";
    const url = `https://cdn.discordapp.com/emojis/${id}.${ext}`;
    const newEmoji = await guild.emojis.create({ attachment: url, name }).catch(() => null);
    if (!newEmoji) return message.reply("❌ Failed to add emoji.");
    return message.channel.send(`✅ Emoji **${newEmoji.name}** added! ${newEmoji}`);
  }

  if (cmd === "reset") {
    if (!hasModRole(member)) return message.reply("❌ No permission.");
    const overwrites = message.channel.permissionOverwrites.cache;
    const position = message.channel.position;
    const name = message.channel.name;
    const parent = message.channel.parentId;
    const newChannel = await guild.channels.create({
      name, type: ChannelType.GuildText, parent,
      permissionOverwrites: overwrites,
      position,
    });
    await message.channel.delete().catch(() => {});
    return newChannel.send("✅ Channel has been reset.");
  }

  if (cmd === "membercount") {
    const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("👥 Member Count")
      .setDescription(`**${guild.memberCount}** members`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "giveaway") {
    if (!hasModRole(member)) return message.reply("❌ No permission.");
    const timeStr = args[0];
    const prize = args.slice(1).join(" ");
    if (!timeStr || !prize) return message.reply("Usage: `.giveaway <time> <prize>` — Example: `.giveaway 1h iPhone 15`");
    const timeMatch = timeStr.match(/^(\d+)(s|m|h|d)$/);
    if (!timeMatch) return message.reply("❌ Invalid format. Use `5s`, `10m`, `2h`, `1d` (max 14d)");
    const amount = parseInt(timeMatch[1]);
    const unit = timeMatch[2];
    const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
    const duration = amount * multipliers[unit];
    const maxDuration = 14 * 24 * 60 * 60 * 1000;
    if (duration > maxDuration) return message.reply("❌ Maximum giveaway duration is **14 days**.");
    const endTime = Math.floor((Date.now() + duration) / 1000);
    const unitNames = { s: "second(s)", m: "minute(s)", h: "hour(s)", d: "day(s)" };
    const embed = new EmbedBuilder()
      .setColor(0xf1c40f).setTitle("🎉 GIVEAWAY 🎉")
      .setDescription(`**Prize:** ${prize}\n\n**Duration:** ${amount} ${unitNames[unit]}\n**Ends:** <t:${endTime}:R>\n\nReact with 🎉 to enter!`)
      .setFooter({ text: `Hosted by ${member.user.tag} • ⚡ Powered by Titam Helper` })
      .setTimestamp(new Date(endTime * 1000));
    const giveawayMsg = await message.channel.send({ embeds: [embed] });
    await giveawayMsg.react("🎉");
    setTimeout(async () => {
      const fetchedMsg = await giveawayMsg.fetch().catch(() => null);
      if (!fetchedMsg) return;
      const reaction = fetchedMsg.reactions.cache.get("🎉");
      const users = await reaction?.users.fetch();
      const eligible = users?.filter(u => !u.bot);
      if (!eligible || eligible.size === 0) {
        return message.channel.send("🎉 Giveaway ended — no valid entries.");
      }
      const winner = eligible.random();
      const winEmbed = new EmbedBuilder()
        .setColor(0xf1c40f).setTitle("🎉 Giveaway Ended!")
        .setDescription(`**Prize:** ${prize}\n**Winner:** ${winner}\n\nCongratulations! 🎊`)
        .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
      return message.channel.send({ content: `${winner}`, embeds: [winEmbed] });
    }, duration);
    return;
  }

  // ── .lock ─────────────────────────────────
  if (cmd === "lock") {
    if (!hasModRole(member)) return message.reply("❌ No permission.");
    await message.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
    const embed = new EmbedBuilder().setColor(0xff0000).setTitle("🔒 Channel Locked")
      .setDescription(`${message.channel} has been locked by ${member}.`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .unlock ───────────────────────────────
  if (cmd === "unlock") {
    if (!hasModRole(member)) return message.reply("❌ No permission.");
    await message.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null });
    const embed = new EmbedBuilder().setColor(0x57f287).setTitle("🔓 Channel Unlocked")
      .setDescription(`${message.channel} has been unlocked by ${member}.`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .nick ─────────────────────────────────
  if (cmd === "nick") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ Owner only.");
    const target = message.mentions.members.first();
    const nick = args.slice(1).join(" ");
    if (!target || !nick) return message.reply("Usage: `.nick @user <nickname>`");
    await target.setNickname(nick).catch(() => {});
    const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("✏️ Nickname Changed")
      .addFields({ name: "User", value: `${target}`, inline: true }, { name: "New Nick", value: nick, inline: true }, { name: "By", value: `${member}`, inline: true })
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .snipe ────────────────────────────────
  if (cmd === "snipe") {
    const sniped = snipeData.get(message.channel.id);
    if (!sniped) return message.reply("❌ No recently deleted messages found.");
    const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("🔍 Sniped Message")
      .setDescription(sniped.content || "*No text content*")
      .setThumbnail(sniped.author.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Author", value: `${sniped.author.tag}`, inline: true },
        { name: "Deleted", value: `<t:${Math.floor(sniped.deletedAt / 1000)}:R>`, inline: true },
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .poll ─────────────────────────────────
  if (cmd === "poll") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ Owner only.");
    const question = args.join(" ");
    if (!question) return message.reply("Usage: `.poll <question>`");
    const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("📊 Poll")
      .setDescription(question)
      .addFields({ name: "Vote", value: "✅ Yes | ❌ No", inline: false })
      .setFooter({ text: `Poll by ${member.user.tag} • ⚡ Powered by Titam Helper` }).setTimestamp();
    const pollMsg = await message.channel.send({ embeds: [embed] });
    await pollMsg.react("✅");
    await pollMsg.react("❌");
    return;
  }

  // ── .remind ───────────────────────────────
  if (cmd === "remind") {
    const timeStr = args[0];
    const reminder = args.slice(1).join(" ");
    if (!timeStr || !reminder) return message.reply("Usage: `.remind <time> <message>` — Example: `.remind 10m Do the trade`");
    const timeMatch = timeStr.match(/^(\d+)(s|m|h|d)$/);
    if (!timeMatch) return message.reply("❌ Invalid format. Use `5s`, `10m`, `2h`, `1d`");
    const amount = parseInt(timeMatch[1]);
    const unit = timeMatch[2];
    const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
    const duration = amount * multipliers[unit];
    const unitNames = { s: "second(s)", m: "minute(s)", h: "hour(s)", d: "day(s)" };
    await message.reply(`✅ I'll remind you in **${amount} ${unitNames[unit]}**!`);
    setTimeout(() => {
      message.author.send(`⏰ **Reminder:** ${reminder}`).catch(() => {
        message.channel.send(`⏰ ${message.author} **Reminder:** ${reminder}`);
      });
    }, duration);
    return;
  }

  // ── .coinflip ─────────────────────────────
  if (cmd === "coinflip") {
    const result = Math.random() < 0.5 ? "🪙 Heads" : "🪙 Tails";
    const embed = new EmbedBuilder().setColor(0xf1c40f).setTitle("🪙 Coin Flip")
      .setDescription(`**${result}!**`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .8ball ────────────────────────────────
  if (cmd === "8ball") {
    const question = args.join(" ");
    if (!question) return message.reply("Usage: `.8ball <question>`");
    const responses = [
      "✅ It is certain.", "✅ Without a doubt.", "✅ Yes, definitely.",
      "✅ You may rely on it.", "✅ Most likely.", "✅ Signs point to yes.",
      "🤔 Reply hazy, try again.", "🤔 Ask again later.", "🤔 Cannot predict now.",
      "❌ Don't count on it.", "❌ My reply is no.", "❌ Very doubtful.", "❌ Outlook not so good.",
    ];
    const answer = responses[Math.floor(Math.random() * responses.length)];
    const embed = new EmbedBuilder().setColor(0x2b2d31).setTitle("🎱 Magic 8 Ball")
      .addFields({ name: "❓ Question", value: question, inline: false }, { name: "🎱 Answer", value: answer, inline: false })
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .lookup ───────────────────────────────
  if (cmd === "lookup") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ Owner only.");
    const userId = args[0];
    if (!userId) return message.reply("Usage: `.lookup <userID>`");
    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) return message.reply("❌ User not found.");
    const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("🔍 User Lookup")
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: "Tag",            value: user.tag,                                              inline: true },
        { name: "ID",             value: user.id,                                               inline: true },
        { name: "Account Created",value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,  inline: true },
        { name: "Bot",            value: user.bot ? "Yes" : "No",                               inline: true },
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── STAFF MANAGEMENT (Owner only) ─────────

  if (cmd === "stafflist") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ Owner only.");
    const staffRoles = [
      { name: "President",        id: ROLES.PRESIDENT },
      { name: "Team Lead",        id: ROLES.TEAM_LEAD },
      { name: "Chief Lead",       id: ROLES.CHIEF_LEAD },
      { name: "Operational Lead", id: ROLES.OPERATIONAL_LEAD },
      { name: "Co-Owner",         id: ROLES.CO_OWNER },
      { name: "Administration",   id: ROLES.ADMINISTRATION },
      { name: "Lead Coordinator", id: ROLES.LEAD_COORDINATOR },
      { name: "Head Moderator",   id: ROLES.HEAD_MODERATOR },
      { name: "Moderator",        id: ROLES.MODERATOR },
      { name: "MM Manager",       id: ROLES.MM_MANAGER },
      { name: "Head Middleman",   id: ROLES.HEAD_MIDDLEMAN },
      { name: "Middleman",        id: ROLES.MIDDLEMAN },
    ];
    const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("👥 Staff List").setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    for (const r of staffRoles) {
      const role = guild.roles.cache.get(r.id);
      if (!role) continue;
      const members = role.members.map(m => m.user.tag).join(", ") || "None";
      embed.addFields({ name: r.name, value: members, inline: false });
    }
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "inactive") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ Owner only.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Usage: `.inactive @user`");
    const embed = new EmbedBuilder().setColor(0x99aab5).setTitle("💤 Member Marked Inactive")
      .addFields({ name: "User", value: `${target}`, inline: true }, { name: "By", value: `${member}`, inline: true })
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    await target.send(`You have been marked as **inactive** in **${guild.name}**. Please reach out to staff if this is a mistake.`).catch(() => {});
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "trial") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ Owner only.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Usage: `.trial @user`");
    const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("🔰 Trial Period Started")
      .addFields({ name: "User", value: `${target}`, inline: true }, { name: "By", value: `${member}`, inline: true })
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    await target.send(`You have started your **trial period** as a Middleman in **${guild.name}**. Good luck! 🎉`).catch(() => {});
    return message.channel.send({ embeds: [embed] });
  }

  // ── TICKET IMPROVEMENTS ────────────────────

  if (cmd === "ticketstats") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ Owner only.");
    const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("📊 Ticket Stats")
      .addFields(
        { name: "Open Tickets", value: `${tickets.size}`, inline: true },
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "addnote") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ Owner only.");
    const ticket = tickets.get(message.channel.id);
    if (!ticket) return message.reply("❌ Not a ticket channel.");
    const note = args.join(" ");
    if (!note) return message.reply("Usage: `.addnote <text>`");
    const embed = new EmbedBuilder().setColor(0xffa500).setTitle("📝 Staff Note")
      .setDescription(note)
      .addFields({ name: "Added by", value: `${member}`, inline: true })
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "rename") {
    if (!hasStaffRole(member) && !member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ No permission.");
    const ticket = tickets.get(message.channel.id);
    if (!ticket) return message.reply("❌ Not a ticket channel.");
    const newName = args.join("-").toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!newName) return message.reply("Usage: `.rename <name>`");
    await message.channel.setName(newName).catch(() => {});
    return message.channel.send(`✅ Channel renamed to **${newName}**.`);
  }

  // ── FUN (Everyone) ─────────────────────────

  if (cmd === "coinflip" || cmd === "toss") {
    const result = Math.random() < 0.5 ? "🪙 Heads!" : "🪙 Tails!";
    return message.channel.send(result);
  }

  if (cmd === "8ball") {
    const question = args.join(" ");
    if (!question) return message.reply("Usage: `.8ball <question>`");
    const responses = [
      "✅ Yes!", "✅ Definitely!", "✅ Without a doubt!", "✅ Most likely.",
      "❓ Ask again later.", "❓ Cannot predict now.", "❓ It is uncertain.",
      "❌ No.", "❌ Definitely not.", "❌ Don't count on it.", "❌ Very doubtful.",
    ];
    const answer = responses[Math.floor(Math.random() * responses.length)];
    const embed = new EmbedBuilder().setColor(0x2b2d31).setTitle("🎱 Magic 8Ball")
      .addFields({ name: "Question", value: question, inline: false }, { name: "Answer", value: answer, inline: false })
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "rate") {
    const target = message.mentions.users.first() || message.author;
    const rating = Math.floor(Math.random() * 11);
    const bar = "█".repeat(rating) + "░".repeat(10 - rating);
    const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("⭐ Rating")
      .setDescription(`${target} gets a **${rating}/10**\n\`${bar}\``)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "ship") {
    const user1 = message.mentions.users.first();
    const user2 = [...message.mentions.users.values()][1];
    if (!user1 || !user2) return message.reply("Usage: `.ship @user1 @user2`");
    const love = Math.floor(Math.random() * 101);
    const bar = "❤️".repeat(Math.floor(love / 10)) + "🖤".repeat(10 - Math.floor(love / 10));
    const embed = new EmbedBuilder().setColor(0xff69b4).setTitle("💘 Ship Calculator")
      .setDescription(`${user1} 💕 ${user2}\n\n**${love}% compatible!**\n${bar}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "dih") {
    const target = message.mentions.users.first() || message.author;
    const size = Math.floor(Math.random() * 16);
    const pp = "8" + "=".repeat(size) + "D";
    return message.channel.send(`${target}'s dih: \`${pp}\``);
  }

  if (cmd === "puh") {
    const target = message.mentions.users.first() || message.author;
    const level = Math.floor(Math.random() * 101);
    const bar = "🌸".repeat(Math.min(Math.floor(level / 10), 10)) || "🖤";
    const msg =
      level === 0   ? `🖤 **${target.username}**'s pussy is **not pink at all**. Pure darkness.` :
      level >= 90   ? `🌸 **${target.username}**'s pussy is **${level}% pink**. Extremely pink. Wow.` :
      level >= 60   ? `💗 **${target.username}**'s pussy is **${level}% pink**. Pretty pink ngl.` :
      level >= 30   ? `🩷 **${target.username}**'s pussy is **${level}% pink**. Decent.` :
      `🤍 **${target.username}**'s pussy is only **${level}% pink**. Barely there.`;
    const embed = new EmbedBuilder()
      .setColor(0xff69b4)
      .setTitle("🌸 Pink-O-Meter")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`${msg}\n\n${bar}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }
  if (cmd === "bitches") {
    const target = message.mentions.users.first() || message.author;
    const count = Math.floor(Math.random() * 101);
    const bar = count === 0 ? "💀" : "👩".repeat(Math.min(count, 10));
    const msg =
      count === 0 ? `💀 **${target.username}** has **0 bitches**. Absolutely nobody.` :
      count >= 80 ? `😤 **${target.username}** has **${count} bitches**. Certified player.` :
      count >= 50 ? `😏 **${target.username}** has **${count} bitches**. Not bad.` :
      `😐 **${target.username}** has **${count} bitches**.`;
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB).setTitle("👩 Bitch Counter")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`${msg}\n\n${bar}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "iq") {
    const target = message.mentions.users.first() || message.author;
    const iq = Math.floor(Math.random() * 201);
    const msg = iq <= 60 ? "🧠 Barely functioning." : iq <= 100 ? "😐 Average at best." : iq <= 150 ? "🤓 Pretty smart ngl." : "🧬 Galaxy brain.";
    const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("🧠 IQ Test")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.username}**'s IQ is **${iq}**\n${msg}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "simp") {
    const target = message.mentions.users.first() || message.author;
    const level = Math.floor(Math.random() * 101);
    const msg = level >= 80 ? "🥺 Certified simp. No hope." : level >= 50 ? "😬 Mid-level simp." : level >= 20 ? "😏 Slightly simping." : "😎 Not a simp at all.";
    const embed = new EmbedBuilder().setColor(0xff69b4).setTitle("🥺 Simp Meter")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.username}** is **${level}% simp**\n${"🥺".repeat(Math.floor(level / 10)) || "😎"}\n${msg}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "gay") {
    const target = message.mentions.users.first() || message.author;
    const level = Math.floor(Math.random() * 101);
    const msg = level >= 80 ? "🏳️‍🌈 Very gay." : level >= 50 ? "🤔 Kinda gay ngl." : level >= 20 ? "😐 A little gay." : "💯 Straight as a ruler.";
    const embed = new EmbedBuilder().setColor(0xff69b4).setTitle("🏳️‍🌈 Gay Meter")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.username}** is **${level}% gay**\n${msg}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "virgin") {
    const target = message.mentions.users.first() || message.author;
    const level = Math.floor(Math.random() * 101);
    const msg = level >= 80 ? "🧸 Definitely a virgin." : level >= 50 ? "🤷 Probably a virgin." : level >= 20 ? "😏 Probably not." : "💅 Absolutely not a virgin.";
    const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("🧸 Virgin Detector")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.username}** is **${level}% virgin**\n${msg}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "sus") {
    const target = message.mentions.users.first() || message.author;
    const level = Math.floor(Math.random() * 101);
    const msg = level >= 80 ? "🔴 VERY sus. Eject immediately." : level >= 50 ? "🟡 Kinda sus ngl." : level >= 20 ? "🟢 Slightly sus." : "✅ Not sus at all.";
    const embed = new EmbedBuilder().setColor(0xff4444).setTitle("📮 Sus Meter")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.username}** is **${level}% sus**\n${msg}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "rizz") {
    const target = message.mentions.users.first() || message.author;
    const level = Math.floor(Math.random() * 101);
    const msg = level >= 80 ? "😎 W rizz. Undeniable." : level >= 50 ? "🙂 Mid rizz." : level >= 20 ? "😬 Low rizz." : "💀 Zero rizz. L.";
    const embed = new EmbedBuilder().setColor(0x57f287).setTitle("😎 Rizz Meter")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.username}**'s rizz is **${level}%**\n${"✨".repeat(Math.floor(level / 10)) || "💀"}\n${msg}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "broke") {
    const target = message.mentions.users.first() || message.author;
    const level = Math.floor(Math.random() * 101);
    const msg = level >= 80 ? "💸 Absolutely broke. Check the couch cushions." : level >= 50 ? "😬 Pretty broke ngl." : level >= 20 ? "🙂 Managing." : "💰 Actually rich.";
    const embed = new EmbedBuilder().setColor(0xffa500).setTitle("💸 Broke Meter")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.username}** is **${level}% broke**\n${msg}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "wanted") {
    const target = message.mentions.users.first() || message.author;
    const stars = Math.floor(Math.random() * 6);
    const starBar = "⭐".repeat(stars) || "😇 Not wanted at all.";
    const msgs = ["😇 Clean record.", "🚔 Minor offenses.", "🚨 Police are watching.", "🚁 Helicopters deployed.", "💥 SWAT team incoming.", "☠️ Most wanted. Run."];
    const embed = new EmbedBuilder().setColor(0xff0000).setTitle("🚨 Wanted Level")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.username}**'s wanted level: **${stars}/5**\n${starBar}\n${msgs[stars]}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "skill") {
    const target = message.mentions.users.first() || message.author;
    const level = Math.floor(Math.random() * 101);
    const msg = level >= 80 ? "🔥 Extremely skilled." : level >= 50 ? "👍 Decent skills." : level >= 20 ? "😐 Below average." : "💀 Completely unskilled.";
    const embed = new EmbedBuilder().setColor(0x57f287).setTitle("🔥 Skill Level")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.username}**'s skill level is **${level}%**\n${"🔥".repeat(Math.floor(level / 10)) || "💀"}\n${msg}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "bodycount") {
    const target = message.mentions.users.first() || message.author;
    const count = Math.floor(Math.random() * 51);
    const serverMembers = guild.members.cache.filter(m => !m.user.bot && m.user.id !== target.id);
    const shuffled = [...serverMembers.values()].sort(() => Math.random() - 0.5).slice(0, Math.min(count, 5));
    const names = shuffled.map(m => m.user.username).join(", ") || "nobody";
    const msg = count === 0 ? "💀 Virgin confirmed." : count >= 30 ? "😱 Absolutely cooked. No redemption." : count >= 15 ? "😬 That's a lot ngl." : "😏 Decent bodycount.";
    const embed = new EmbedBuilder().setColor(0xff69b4).setTitle("💅 Bodycount")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.username}** has slept with **${count} people**\n${msg}\n\n👀 **Including:** ${names}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "horny") {
    const target = message.mentions.users.first() || message.author;
    const level = Math.floor(Math.random() * 101);
    const msg = level >= 80 ? "🔥 Absolutely horny. Calm down." : level >= 50 ? "😳 Pretty horny ngl." : level >= 20 ? "😐 Slightly horny." : "🧊 Cold as ice.";
    const embed = new EmbedBuilder().setColor(0xff4444).setTitle("🔥 Horny Meter")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.username}** is **${level}% horny**\n${"🔥".repeat(Math.floor(level / 10)) || "🧊"}\n${msg}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "daddy") {
    const target = message.mentions.users.first() || message.author;
    const level = Math.floor(Math.random() * 101);
    const msg = level >= 80 ? "😏 Big daddy energy. No debate." : level >= 50 ? "🙂 Daddy-ish." : level >= 20 ? "😬 Barely." : "💀 Not a daddy at all.";
    const embed = new EmbedBuilder().setColor(0x2b2d31).setTitle("😏 Daddy Meter")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.username}** is **${level}% daddy**\n${msg}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "freak") {
    const target = message.mentions.users.first() || message.author;
    const level = Math.floor(Math.random() * 101);
    const msg = level >= 80 ? "😈 Certified freak. Seven days a week." : level >= 50 ? "😏 Pretty freaky." : level >= 20 ? "🙂 Mild freak." : "🧸 Pure soul.";
    const embed = new EmbedBuilder().setColor(0xff69b4).setTitle("😈 Freak Meter")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.username}** is **${level}% freak**\n${"😈".repeat(Math.floor(level / 10)) || "🧸"}\n${msg}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "thirst") {
    const target = message.mentions.users.first() || message.author;
    const level = Math.floor(Math.random() * 101);
    const msg = level >= 80 ? "🥤 Extremely thirsty. Drink water." : level >= 50 ? "😬 Pretty thirsty." : level >= 20 ? "😐 Slightly thirsty." : "😎 Not thirsty at all.";
    const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("🥤 Thirst Meter")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.username}** is **${level}% thirsty**\n${msg}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "submissive") {
    const target = message.mentions.users.first() || message.author;
    const level = Math.floor(Math.random() * 101);
    const msg = level >= 80 ? "🐾 Very submissive. Yes sir." : level >= 50 ? "😳 Pretty submissive." : level >= 20 ? "😐 Slightly." : "😤 Not submissive at all.";
    const embed = new EmbedBuilder().setColor(0xff69b4).setTitle("🐾 Submissive Meter")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.username}** is **${level}% submissive**\n${msg}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "dominant") {
    const target = message.mentions.users.first() || message.author;
    const level = Math.floor(Math.random() * 101);
    const msg = level >= 80 ? "👑 Full dominant. Boss mode." : level >= 50 ? "😏 Pretty dominant." : level >= 20 ? "🙂 Slightly dominant." : "🐾 Not dominant at all.";
    const embed = new EmbedBuilder().setColor(0x2b2d31).setTitle("👑 Dominant Meter")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.username}** is **${level}% dominant**\n${msg}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "fuckable") {
    const target = message.mentions.users.first() || message.author;
    const level = Math.floor(Math.random() * 101);
    const msg = level >= 80 ? "😍 Very fuckable. No debate." : level >= 50 ? "😏 Pretty fuckable." : level >= 20 ? "😐 Meh." : "💀 Not at all. Sorry.";
    const embed = new EmbedBuilder().setColor(0xff69b4).setTitle("💅 Fuckable Rating")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.username}** is **${level}% fuckable**\n${"💅".repeat(Math.floor(level / 10)) || "💀"}\n${msg}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "boobs") {
    const target = message.mentions.users.first() || message.author;
    const size = Math.floor(Math.random() * 10);
    const sizes = ["AAA 😭", "AA 💀", "A 😐", "B 🙂", "C 😏", "D 👀", "DD 😳", "DDD 🤯", "E 💀 (fake?)", "F+ 🏆 (definitely fake)"];
    const bar = "🍈".repeat(size + 1);
    const embed = new EmbedBuilder().setColor(0xff69b4).setTitle("🍈 Boob Rater")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.username}**'s boobs are a **${sizes[size]}**\n\n${bar}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "sex") {
    const user1 = message.mentions.users.first();
    const user2 = [...message.mentions.users.values()][1] || message.author;
    if (!user1) return message.reply("Usage: `.sex @user1 @user2`");
    const dihSize = Math.floor(Math.random() * 16);
    const puhSize = Math.floor(Math.random() * 16);
    const depth = Math.floor(Math.random() * 101);
    const dih = "8" + "=".repeat(dihSize) + "D";
    const puh = "(" + "~".repeat(puhSize) + ")";
    const fits = depth >= 70 ? "✅ Perfect fit. No complaints." : depth >= 40 ? "😬 Kinda fits." : "💀 Doesn't fit at all. RIP.";
    const embed = new EmbedBuilder().setColor(0xff69b4).setTitle("💦 Sex Simulator")
      .setThumbnail(user1.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `**${user1.username}** 🍆 x **${user2.username}** 🍑\n\n` +
        `🍆 Dih: \`${dih}\`\n` +
        `🍑 Puh: \`${puh}\`\n\n` +
        `📏 Depth: **${depth}%**\n${fits}`
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "onlyfans") {
    const target = message.mentions.users.first() || message.author;
    const level = Math.floor(Math.random() * 101);
    const msg = level >= 80 ? "💰 Would make a fortune on OnlyFans." : level >= 50 ? "📸 Decent chance of success." : level >= 20 ? "😐 Maybe not." : "💀 Please don't.";
    const embed = new EmbedBuilder().setColor(0x00aff4).setTitle("💙 OnlyFans Potential")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.username}** has **${level}%** chance of making it on OnlyFans\n${msg}`)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "poll") {
    const question = args.join(" ");
    if (!question) return message.reply("Usage: `.poll <question>`");
    const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("📊 Poll")
      .setDescription(`**${question}**`)
      .addFields({ name: "Vote", value: "✅ Yes | ❌ No", inline: false })
      .setFooter({ text: `Poll by ${member.user.tag} • ⚡ Powered by Titam Helper` }).setTimestamp();
    const pollMsg = await message.channel.send({ embeds: [embed] });
    await pollMsg.react("✅");
    await pollMsg.react("❌");
    return;
  }

  // ── SECURITY (Owner only) ──────────────────

  if (cmd === "alts") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ Owner only.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Usage: `.alts @user`");
    const accountAge = Date.now() - target.user.createdTimestamp;
    const days = Math.floor(accountAge / (1000 * 60 * 60 * 24));
    const suspicious = days < 30;
    const embed = new EmbedBuilder()
      .setColor(suspicious ? 0xff0000 : 0x57f287)
      .setTitle(suspicious ? "🚨 Suspicious Account" : "✅ Account Looks Fine")
      .addFields(
        { name: "User",          value: target.user.tag,                                        inline: true },
        { name: "Account Age",   value: `${days} days`,                                         inline: true },
        { name: "Created",       value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "Status",        value: suspicious ? "⚠️ Account is less than 30 days old!" : "✅ Account is older than 30 days", inline: false },
      ).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "accountage") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ Owner only.");
    const target = message.mentions.users.first() || message.author;
    const days = Math.floor((Date.now() - target.createdTimestamp) / (1000 * 60 * 60 * 24));
    const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("📅 Account Age")
      .addFields(
        { name: "User",    value: target.tag,                                              inline: true },
        { name: "Age",     value: `${days} days`,                                          inline: true },
        { name: "Created", value: `<t:${Math.floor(target.createdTimestamp / 1000)}:F>`,   inline: true },
      ).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "newaccounts") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ Owner only.");
    await guild.members.fetch();
    const newMembers = guild.members.cache
      .filter(m => Date.now() - m.user.createdTimestamp < 7 * 24 * 60 * 60 * 1000)
      .sort((a, b) => b.user.createdTimestamp - a.user.createdTimestamp)
      .first(10);
    const list = newMembers.map(m => `${m.user.tag} — <t:${Math.floor(m.user.createdTimestamp / 1000)}:R>`).join("\n") || "None found";
    const embed = new EmbedBuilder().setColor(0xffa500).setTitle("🆕 New Accounts (under 7 days)")
      .setDescription(list)
      .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .mm1 ──────────────────────────────────
  if (cmd === "mm1") {
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle("🤝 What is a Middleman? — Type 1")
      .setDescription(
        "• A middleman is a trusted go-between who holds payment until the seller delivers goods or services.\n\n" +
        "• The funds are released once the buyer confirms everything is as agreed.\n\n" +
        "• This process helps prevent scams, build trust, and resolve disputes.\n\n" +
        "• Common in valuable games, real-life money trades, in-game currency, and collectibles.\n\n" +
        "• Only works safely if the middleman is reputable and verified."
      )
      .setImage("https://cdn.discordapp.com/attachments/1482756353431834786/1483851833758847279/middleman1_2.webp?ex=69bc1835&is=69bac6b5&hm=678bb8f437a8c22ed5c6ae2b5a374cdfa945d86f999439b4327dfdcbe4445538&")
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .mm2 ──────────────────────────────────
  if (cmd === "mm2") {
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle("🤝 What is a Middleman? — Type 2")
      .setDescription(
        "• A middleman is a trusted go-between who receives items from both parties.\n\n" +
        "• Once verified, the middleman distributes the items to each party as agreed.\n\n" +
        "• This process ensures fairness and prevents scams.\n\n" +
        "• Common in mutual trades, swaps, and high-value exchanges.\n\n" +
        "• Only works safely if the middleman is reputable and verified."
      )
      .setImage("https://cdn.discordapp.com/attachments/1482756353431834786/1483851798728015892/middleman2_1.webp?ex=69bc182d&is=69bac6ad&hm=5a975b265d504a31ebfc212514c71dd1b9d46e86ac4027ee17ea0ba8528e7b49&")
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .lookup ───────────────────────────────
  if (cmd === "lookup") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ Owner only.");
    const userId = args[0];
    if (!userId) return message.reply("Usage: `.lookup <userID>`");
    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) return message.reply("❌ User not found.");
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle(`🔍 User Lookup — ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "ID",              value: user.id,                                             inline: true },
        { name: "Username",        value: user.tag,                                            inline: true },
        { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "Bot",             value: user.bot ? "Yes" : "No",                            inline: true },
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .poll ─────────────────────────────────
  if (cmd === "poll") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ Owner only.");
    const question = args.join(" ");
    if (!question) return message.reply("Usage: `.poll <question>`");
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle("📊 Poll")
      .setDescription(`**${question}**`)
      .setFooter({ text: `Poll by ${member.user.tag} • ⚡ Powered by Titam Helper` })
      .setTimestamp();
    const pollMsg = await message.channel.send({ embeds: [embed] });
    await pollMsg.react("✅");
    await pollMsg.react("❌");
    return message.delete().catch(() => {});
  }

  // ── .nick ─────────────────────────────────
  if (cmd === "nick") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ Owner only.");
    const target = message.mentions.members.first();
    const nick = args.slice(1).join(" ") || null;
    if (!target) return message.reply("Usage: `.nick @user <nickname>` or `.nick @user` to reset");
    await target.setNickname(nick).catch(() => {});
    return message.channel.send(`✅ Nickname for ${target} has been ${nick ? `set to **${nick}**` : "reset"}.`);
  }

  // ── .snipe ────────────────────────────────
  if (cmd === "snipe") {
    const snipedMsg = snipeData.get(message.channel.id);
    if (!snipedMsg) return message.reply("❌ No recently deleted messages found.");
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle("🔫 Sniped Message")
      .setDescription(snipedMsg.content || "*No text content*")
      .setThumbnail(snipedMsg.author.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Author",  value: snipedMsg.author.tag,                                          inline: true },
        { name: "Deleted", value: `<t:${Math.floor(snipedMsg.deletedAt / 1000)}:R>`,             inline: true },
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .remind ───────────────────────────────
  if (cmd === "remind") {
    const timeStr = args[0];
    const reminderText = args.slice(1).join(" ");
    if (!timeStr || !reminderText) return message.reply("Usage: `.remind <time> <message>` — Example: `.remind 10m Take a break`");
    const timeMatch = timeStr.match(/^(\d+)(s|m|h|d)$/);
    if (!timeMatch) return message.reply("❌ Invalid format. Use `5s`, `10m`, `2h`, `1d`");
    const amount = parseInt(timeMatch[1]);
    const unit = timeMatch[2];
    const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
    const duration = amount * multipliers[unit];
    const unitNames = { s: "second(s)", m: "minute(s)", h: "hour(s)", d: "day(s)" };
    await message.reply(`✅ I'll remind you in **${amount} ${unitNames[unit]}**!`);
    setTimeout(async () => {
      const reminderEmbed = new EmbedBuilder()
        .setColor(0x87CEEB)
        .setTitle("⏰ Reminder!")
        .setDescription(reminderText)
        .setFooter({ text: "⚡ Powered by Titam Helper" })
        .setTimestamp();
      await message.channel.send({ content: `${message.author}`, embeds: [reminderEmbed] });
    }, duration);
    return;
  }

  // ── .coinflip ─────────────────────────────
  if (cmd === "coinflip") {
    const result = Math.random() < 0.5 ? "🪙 Heads" : "🪙 Tails";
    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle("🪙 Coin Flip")
      .setDescription(`**${result}!**`)
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .8ball ────────────────────────────────
  if (cmd === "8ball") {
    const question = args.join(" ");
    if (!question) return message.reply("Usage: `.8ball <question>`");
    const responses = [
      "✅ It is certain.", "✅ Without a doubt.", "✅ Yes, definitely.",
      "✅ You may rely on it.", "✅ Most likely.", "✅ Signs point to yes.",
      "🤔 Reply hazy, try again.", "🤔 Ask again later.", "🤔 Cannot predict now.",
      "❌ Don't count on it.", "❌ Very doubtful.", "❌ My sources say no.",
      "❌ Outlook not so good.", "❌ My reply is no.",
    ];
    const answer = responses[Math.floor(Math.random() * responses.length)];
    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle("🎱 Magic 8-Ball")
      .addFields(
        { name: "Question", value: question, inline: false },
        { name: "Answer",   value: answer,   inline: false },
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .servicepanel ─────────────────────────
  if (cmd === "servicepanel") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("Owner only.");
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle("🤖 Titam Helper — Bot Service")
      .setDescription(
        "Welcome! I build and customize Discord bots for your server.\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
        "💰 **Pricing Plans**\n\n" +
        "⏱️ **Weekly** — **$2/week**\n" +
        "• Bot hosted & running for 1 week\n" +
        "• Basic setup included\n\n" +
        "📅 **Monthly** — **$7/month**\n" +
        "• Bot hosted & running for 1 month\n" +
        "• Basic setup included\n\n" +
        "♾️ **Lifetime** — **$15 one-time**\n" +
        "• Bot hosted forever\n" +
        "• Full setup included\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
        "⚙️ **Custom Commands**\n" +
        "• **$0.50 per command** — add any custom command to your bot\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
        "📩 *Click the button below to open a service ticket and get started!*"
      )
      .setFooter({ text: "⚡ Powered by Titam Helper • Bot Service" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("open_service_weekly").setLabel("⏱️ Weekly — $2").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("open_service_monthly").setLabel("📅 Monthly — $7").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("open_service_lifetime").setLabel("♾️ Lifetime — $15").setStyle(ButtonStyle.Success),
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("open_service_cmd").setLabel("⚙️ Custom Command — $0.50/cmd").setStyle(ButtonStyle.Secondary),
    );
    return message.channel.send({ embeds: [embed], components: [row, row2] });
  }

  // ── .faq ──────────────────────────────────
  if (cmd === "faq") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ Owner only.");
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle("📌 Frequently Asked Questions")
      .addFields(
        { name: "Q1: How do I get a role?",              value: "A: Roles are assigned based on activity, applications, or commands. Check <#1482756352265949288>.",                    inline: false },
        { name: "Q2: How do I report someone?",          value: "A: Use <#1482756352454561806> or DM a moderator.",                                                                      inline: false },
        { name: "Q3: Why was my message deleted?",       value: "A: It may have violated a server rule. Please check the rules in <#1482756352265949287>.",                             inline: false },
        { name: "Q4: Can I advertise my server or content?", value: "A: Only with permission or if you are renting a channel.",                                                         inline: false },
        { name: "Q5: What do I do if I was scammed?",   value: "A: Go to <#1482756352454561806> immediately. Provide all proof you have.",                                              inline: false },
        { name: "Q6: How do I apply for staff?",         value: "A: Check <#1482756352265949288> and forms.",                                                                           inline: false },
        { name: "Q7: Why can't I type in some channels?", value: "A: Some channels are restricted by roles or are read-only. Earn roles to unlock more access.",                        inline: false },
        { name: "\u200b",                                value: "Need more help? Open a support ticket or DM a mod.",                                                                   inline: false },
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .announce ─────────────────────────────
  if (cmd === "announce") {
    if (!member.roles.cache.has(ROLES.PRESIDENT) && !member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("❌ President only.");
    const channel = message.mentions.channels.first();
    const text = args.slice(1).join(" ");
    if (!channel || !text) return message.reply("Usage: `.announce #channel Your message`");
    const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("📢 Announcement").setDescription(text)
      .setFooter({ text: `Announced by ${member.user.tag} • ⚡ Powered by Titam Helper` }).setTimestamp();
    await channel.send({ embeds: [embed] });
    return message.reply(`✅ Announcement sent to ${channel}!`);
  }

  // ── .ticketpanel ──────────────────────────
  if (cmd === "ticketpanel") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("Owner only.");
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle("🤝 Request a MiddleMan")
      .setDescription(
        "👋 **Welcome to our server's MM Service!**\n\n" +
        "If you are in need of an MM, please read our **Middleman ToS** first and then tap the **Request Middleman** button below.\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━\n" +
        "📋 **Important Rules**\n" +
        "• ✅ You must vouch your middleman after the trade\n" +
        "• ⏰ Failing to vouch within **24 hours** = 🔴 Blacklist from MM Service\n" +
        "• 🚫 Creating troll tickets = **Middleman ban**\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━\n" +
        "⚠️ **Disclaimer**\n" +
        "• We are **NOT** responsible for anything that happens after the trade\n" +
        "• We are **NOT** responsible for any duped items\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━\n" +
        "*By opening a ticket or requesting a middleman, you agree to our Middleman ToS.*"
      )
      .setImage("https://i.imgur.com/kNkKRxE.png")
      .setFooter({ text: "⚡ Powered by Titam Helper • Middleman Service" })
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("open_ticket").setLabel("🤝 Request Middleman").setStyle(ButtonStyle.Primary),
    );
    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // ── .supportpanel ─────────────────────────
  if (cmd === "supportpanel") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("Owner only.");
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle("🎧 Support Center")
      .setDescription(
        "Need help? Open a ticket and our team will assist you.\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━\n" +
        "📌 **What we can help with:**\n\n" +
        "❓ **General Questions**\n🚨 **Report a Scammer**\n⚖️ **Appeals / Unbans**\n🛡️ **Staff Reports**\n🤝 **Trade Issues**\n📩 **Other**\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━\n" +
        "• Check rules first\n• Do not ping staff directly\n• Have evidence ready\n\n" +
        "*Select a category below.*"
      )
      .setImage("https://i.imgur.com/8Jlvmok.png")
      .setFooter({ text: "⚡ Powered by Titam Helper • Support Center" })
      .setTimestamp();
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("support_general").setLabel("❓ General").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("support_scammer").setLabel("🚨 Report Scammer").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("support_appeal").setLabel("⚖️ Appeals").setStyle(ButtonStyle.Primary),
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("support_staffreport").setLabel("🛡️ Staff Reports").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("support_trade").setLabel("🤝 Trade Issues").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("support_other").setLabel("📩 Other").setStyle(ButtonStyle.Secondary),
    );
    return message.channel.send({ embeds: [embed], components: [row1, row2] });
  }

  // ── .warnpanel ────────────────────────────
  if (cmd === "warnpanel") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("Owner only.");
    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle("⚠️ Warn Removal Request")
      .setDescription(
        "Do you want to request a warn removal?\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━\n" +
        "📋 **Requirements:**\n" +
        "• You must have a valid reason\n" +
        "• Provide evidence if applicable\n" +
        "• An **Operational Lead** or above will review your request\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━\n" +
        "*Click the button below to open a warn removal ticket.*"
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("open_warn_ticket").setLabel("📩 Request Warn Removal").setStyle(ButtonStyle.Primary),
    );
    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // ── .buypanel ─────────────────────────────
  if (cmd === "buypanel") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("Owner only.");
    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("🛒 Buy a Role")
      .setDescription(
        "Want to buy a role? Check prices below and open a ticket!\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━\n" +
        "**MM Roles:**\n" +
        "• Middleman — **15 h1ts** OR **$10**\n" +
        "• Head Middleman — **5 alt h1ts** OR **$20** *($10 with MM)*\n" +
        "• MM Manager — **15 alt h1ts** OR **$25** *($10 with Head MM)*\n" +
        "• Moderator — **$40** *($10 with MM Manager)*\n" +
        "• Head Moderator — **$55** *($15 with Mod)*\n" +
        "• Lead Coordinator — **$70** *($15 with Head Mod)*\n" +
        "• Administration — **$80** *($20 with Lead Coord)*\n" +
        "• Co-Owner — **$140** *($50 with Admin)*\n" +
        "• Operational Lead — **$180** *($60 with Co-Owner)*\n" +
        "• Chief Lead — **$250** *($70 with Ops Lead)*\n" +
        "• Team Lead — **$400** *($150 with Chief Lead)*\n" +
        "• President — **$600** *($200 with Team Lead)*\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━\n" +
        "**Special Roles:**\n" +
        "• Support Staff — **$5**\n" +
        "• Prince — **$5**\n" +
        "• Princess — **$5**\n" +
        "• Recruiter — **$5**\n" +
        "• Ban Perms — **$20**\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━\n" +
        "*⚠️ Only make a ticket if purchasing. Troll tickets = demotion.*"
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("open_buy_ticket").setLabel("🛒 Buy a Role").setStyle(ButtonStyle.Success),
    );
    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // ── .indexpanel ───────────────────────────
  if (cmd === "indexpanel") {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply("Owner only.");
    const embed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle("💎 Titam's Index Service")
      .setDescription(
        "Welcome to **Titam's Index Service** — fast, trusted, and professional.\n\n" +
        "Select your base type from the dropdown below to open a ticket and get started.\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
        "💠 **Available Index Types**\n\n" +
        "🌈 **Rainbow** · Rainbow base\n" +
        "🍬 **Candy** · Candy base\n" +
        "☢️ **Radioactive** · Radioactive base\n" +
        "☯️ **Yinyang** · Yinyang base\n" +
        "🌌 **Galaxy** · Galaxy base\n" +
        "🥇 **Gold** · Gold base\n" +
        "💎 **Diamond** · Diamond base\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
        "⚙️ **How It Works**\n" +
        "• You give collateral to the MM.\n" +
        "• MM indexes your item.\n" +
        "• You pay MM once done.\n" +
        "• MM returns your collateral.\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
        "⚠️ **Disclaimer**\n" +
        "Both parties must agree to the deal. Troll tickets will have consequences.\n\n" +
        "*Select an option from the dropdown below to open your ticket.*"
      )
      .setImage("https://i.imgur.com/vjoXNGs.png")
      .setFooter({ text: "⚡ Powered by Titam Helper • Index Service" })
      .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("index_select")
      .setPlaceholder("Select your base type...")
      .addOptions([
        { label: "🌈 Rainbow", description: "Rainbow base index", value: "index_rainbow" },
        { label: "🍬 Candy",   description: "Candy base index",   value: "index_candy" },
        { label: "☢️ Radioactive", description: "Radioactive base index", value: "index_radioactive" },
        { label: "☯️ Yinyang", description: "Yinyang base index", value: "index_yinyang" },
        { label: "🌌 Galaxy",  description: "Galaxy base index",  value: "index_galaxy" },
        { label: "🥇 Gold",    description: "Gold base index",    value: "index_gold" },
        { label: "💎 Diamond", description: "Diamond base index", value: "index_diamond" },
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    return message.channel.send({ embeds: [embed], components: [row] });
  }
});

// =============================================
//  BUTTON INTERACTIONS
// =============================================
client.on("interactionCreate", async (interaction) => {
  const { member, guild, channel } = interaction;

  // ── Index Select Menu ─────────────────────
  if (interaction.isStringSelectMenu() && interaction.customId === "index_select") {
    const selected = interaction.values[0];
    const typeMap = {
      index_rainbow:     "🌈 Rainbow",
      index_candy:       "🍬 Candy",
      index_radioactive: "☢️ Radioactive",
      index_yinyang:     "☯️ Yinyang",
      index_galaxy:      "🌌 Galaxy",
      index_gold:        "🥇 Gold",
      index_diamond:     "💎 Diamond",
    };
    const typeName = typeMap[selected];
    const chName = `index-${member.user.username.toLowerCase()}`;
    const existing = guild.channels.cache.find(c => c.name === chName);
    if (existing) return interaction.reply({ content: "❌ You already have an open index ticket.", ephemeral: true });

    const indexChannel = await guild.channels.create({
      name: chName,
      type: ChannelType.GuildText,
      parent: INDEX_CATEGORY,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        { id: OWNER_ROLE, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ],
    });

    tickets.set(indexChannel.id, { creator: member.id, claimer: null, closedBy: null, users: [member.id], confirmed: new Set() });

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle(`💎 Index Ticket — ${typeName}`)
      .setDescription(
        `Hey ${member}! 👋\n\n` +
        `You've requested a **${typeName}** base index.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📌 **Next steps:**\n` +
        `• State the item you want indexed\n` +
        `• Provide your collateral details\n` +
        `• Agree on the payment amount\n\n` +
        `*Our team will assist you shortly.*`
      )
      .setFooter({ text: "⚡ Powered by Titam Helper • Index Service" })
      .setTimestamp();

    const claimRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`claim_ticket_${indexChannel.id}`).setLabel("✅ Claim").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`close_ticket_${indexChannel.id}`).setLabel("🔒 Close").setStyle(ButtonStyle.Danger),
    );

    await indexChannel.send({ content: `<@&${OWNER_ROLE}> — New **${typeName}** index request from ${member}!` });
    await indexChannel.send({ embeds: [welcomeEmbed], components: [claimRow] });
    return interaction.reply({ content: `✅ Your index ticket has been created: ${indexChannel}`, ephemeral: true });
  }

  if (!interaction.isButton()) return;
  const customId = interaction.customId;

  // ── Service Tickets ───────────────────────
  const serviceTypes = {
    open_service_weekly:   { label: "Weekly Plan — $2/week",       emoji: "⏱️" },
    open_service_monthly:  { label: "Monthly Plan — $7/month",     emoji: "📅" },
    open_service_lifetime: { label: "Lifetime Plan — $15",         emoji: "♾️" },
    open_service_cmd:      { label: "Custom Command — $0.50/cmd",  emoji: "⚙️" },
  };

  if (serviceTypes[customId]) {
    const service = serviceTypes[customId];
    const chName = `service-${member.user.username.toLowerCase()}`;
    const existing = guild.channels.cache.find(c => c.name === chName);
    if (existing) return interaction.reply({ content: "❌ You already have an open service ticket.", ephemeral: true });

    const serviceChannel = await guild.channels.create({
      name: chName,
      type: ChannelType.GuildText,
      parent: SERVICE_CATEGORY,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        { id: ROLES.PRESIDENT, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ],
    });

    tickets.set(serviceChannel.id, { creator: member.id, claimer: null, closedBy: null, users: [member.id], confirmed: new Set() });

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle(`${service.emoji} Service Ticket — ${service.label}`)
      .setDescription(
        `Hey ${member}! 👋\n\n` +
        `Thank you for choosing **Titam Helper Bot Service!**\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📌 **Please provide:**\n` +
        `• Your server name & ID\n` +
        `• What you need customized\n` +
        `• Any specific features you want\n` +
        `• Payment method (crypto, PayPal, etc.)\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*The owner will assist you shortly!*`
      )
      .setFooter({ text: "⚡ Powered by Titam Helper • Bot Service" })
      .setTimestamp();

    const claimRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`claim_ticket_${serviceChannel.id}`).setLabel("✅ Claim").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`close_ticket_${serviceChannel.id}`).setLabel("🔒 Close").setStyle(ButtonStyle.Danger),
    );

    await serviceChannel.send({ content: `<@&${ROLES.PRESIDENT}> — New **${service.label}** service request from ${member}!` });
    await serviceChannel.send({ embeds: [welcomeEmbed], components: [claimRow] });
    return interaction.reply({ content: `✅ Your service ticket has been created: ${serviceChannel}`, ephemeral: true });
  }

  // ── Open MM Ticket ────────────────────────
  if (customId === "open_ticket") {
    if (blacklist.has(member.id)) return interaction.reply({ content: "❌ You are blacklisted from the MM service.", ephemeral: true });
    const existing = guild.channels.cache.find(c => c.name === `ticket-${member.user.username.toLowerCase()}`);
    if (existing) return interaction.reply({ content: "❌ You already have an open ticket.", ephemeral: true });

    const ticketChannel = await guild.channels.create({
      name: `ticket-${member.user.username.toLowerCase()}`,
      type: ChannelType.GuildText,
      parent: MM_TICKETS_CATEGORY,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        { id: ROLES.MIDDLEMAN, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ],
    });

    tickets.set(ticketChannel.id, { creator: member.id, claimer: null, closedBy: null, users: [member.id], confirmed: new Set() });

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle("🎟️ Ticket Opened")
      .setDescription(
        `Hey ${member}! 👋\n\n` +
        `🙏 **Thank you for choosing our Middleman Service!**\n\n` +
        `A member of our 🛡️ **Middleman Team** will assist you shortly.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📌 **While you wait:**\n` +
        `• Describe your trade in detail\n` +
        `• Mention the other party involved\n` +
        `• State the value of items being traded\n\n` +
        `*If you opened this ticket by mistake, a staff member can close it.*`
      )
      .setFooter({ text: "⚡ Powered by Titam Helper • Middleman Service" })
      .setTimestamp();

    const claimRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`claim_ticket_${ticketChannel.id}`).setLabel("✅ Claim Ticket").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`close_ticket_${ticketChannel.id}`).setLabel("🔒 Close Ticket").setStyle(ButtonStyle.Danger),
    );

    await ticketChannel.send({ content: `<@&${ROLES.MIDDLEMAN}> — New ticket opened by ${member}!` });
    await ticketChannel.send({ embeds: [welcomeEmbed], components: [claimRow] });
    return interaction.reply({ content: `✅ Your ticket has been created: ${ticketChannel}`, ephemeral: true });
  }

  // ── Warn Removal Ticket ───────────────────
  if (customId === "open_warn_ticket") {
    const chName = `warn-${member.user.username.toLowerCase()}`;
    const existing = guild.channels.cache.find(c => c.name === chName);
    if (existing) return interaction.reply({ content: "❌ You already have an open warn removal ticket.", ephemeral: true });

    const warnChannel = await guild.channels.create({
      name: chName,
      type: ChannelType.GuildText,
      parent: WARN_TICKET_CATEGORY,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        { id: ROLES.OPERATIONAL_LEAD, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ],
    });

    tickets.set(warnChannel.id, { creator: member.id, claimer: null, closedBy: null, users: [member.id], confirmed: new Set() });

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle("⚠️ Warn Removal Ticket")
      .setDescription(
        `Hey ${member}! 👋\n\n` +
        `Your warn removal request has been received.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📌 **Please provide:**\n` +
        `• The reason you were warned\n` +
        `• Why it should be removed\n` +
        `• Any evidence\n\n` +
        `*An **Operational Lead** will review your request shortly.*`
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();

    const claimRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`claim_ticket_${warnChannel.id}`).setLabel("✅ Claim").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`close_ticket_${warnChannel.id}`).setLabel("🔒 Close").setStyle(ButtonStyle.Danger),
    );

    await warnChannel.send({ content: `<@&${ROLES.OPERATIONAL_LEAD}> — New warn removal request from ${member}!` });
    await warnChannel.send({ embeds: [welcomeEmbed], components: [claimRow] });
    return interaction.reply({ content: `✅ Warn removal ticket created: ${warnChannel}`, ephemeral: true });
  }

  // ── Buy Role Ticket ───────────────────────
  if (customId === "open_buy_ticket") {
    const chName = `buy-${member.user.username.toLowerCase()}`;
    const existing = guild.channels.cache.find(c => c.name === chName);
    if (existing) return interaction.reply({ content: "❌ You already have an open purchase ticket.", ephemeral: true });

    const buyChannel = await guild.channels.create({
      name: chName,
      type: ChannelType.GuildText,
      parent: BUY_ROLE_CATEGORY,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        { id: ROLES.CO_OWNER, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ],
    });

    tickets.set(buyChannel.id, { creator: member.id, claimer: null, closedBy: null, users: [member.id], confirmed: new Set() });

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("🛒 Role Purchase Ticket")
      .setDescription(
        `Hey ${member}! 👋\n\n` +
        `Thank you for your interest in purchasing a role!\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📌 **Please provide:**\n` +
        `• Which role you want to buy\n` +
        `• Your current highest role (for discount)\n` +
        `• Payment method\n\n` +
        `*A **Co-Owner** will assist you shortly.*`
      )
      .setFooter({ text: "⚡ Powered by Titam Helper" })
      .setTimestamp();

    const claimRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`claim_ticket_${buyChannel.id}`).setLabel("✅ Claim").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`close_ticket_${buyChannel.id}`).setLabel("🔒 Close").setStyle(ButtonStyle.Danger),
    );

    await buyChannel.send({ content: `<@&${ROLES.CO_OWNER}> — New role purchase request from ${member}!` });
    await buyChannel.send({ embeds: [welcomeEmbed], components: [claimRow] });
    return interaction.reply({ content: `✅ Purchase ticket created: ${buyChannel}`, ephemeral: true });
  }

  // ── Support Tickets ───────────────────────
  const supportCategories = {
    support_general:     { label: "General Questions", emoji: "❓" },
    support_scammer:     { label: "Report a Scammer",  emoji: "🚨" },
    support_appeal:      { label: "Appeals / Unbans",  emoji: "⚖️" },
    support_staffreport: { label: "Staff Reports",     emoji: "🛡️" },
    support_trade:       { label: "Trade Issues",      emoji: "🤝" },
    support_other:       { label: "Other",             emoji: "📩" },
  };

  if (supportCategories[customId]) {
    const category = supportCategories[customId];
    const chName = `support-${member.user.username.toLowerCase()}`;
    const existing = guild.channels.cache.find(c => c.name === chName);
    if (existing) return interaction.reply({ content: "❌ You already have an open support ticket.", ephemeral: true });

    const supportChannel = await guild.channels.create({
      name: chName,
      type: ChannelType.GuildText,
      parent: SUPPORT_CATEGORY,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        { id: ROLES.SUPPORT_STAFF, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ],
    });

    tickets.set(supportChannel.id, { creator: member.id, claimer: null, closedBy: null, users: [member.id], confirmed: new Set() });

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x87CEEB)
      .setTitle(`${category.emoji} Support — ${category.label}`)
      .setDescription(
        `Hey ${member}! 👋\n\n` +
        `Our **Support Staff** will assist you shortly.\n\n` +
        `📌 **While you wait:**\n` +
        `• Describe your issue in detail\n` +
        `• Attach any evidence or screenshots\n` +
        `• Be patient and respectful`
      )
      .setFooter({ text: "⚡ Powered by Titam Helper • Support Center" })
      .setTimestamp();

    const claimRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`claim_ticket_${supportChannel.id}`).setLabel("✅ Claim").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`close_ticket_${supportChannel.id}`).setLabel("🔒 Close").setStyle(ButtonStyle.Danger),
    );

    await supportChannel.send({ content: `<@&${ROLES.SUPPORT_STAFF}> — New **${category.label}** ticket from ${member}!` });
    await supportChannel.send({ embeds: [welcomeEmbed], components: [claimRow] });
    return interaction.reply({ content: `✅ Support ticket created: ${supportChannel}`, ephemeral: true });
  }

  // ── Claim Ticket Button ───────────────────
  if (customId.startsWith("claim_ticket_")) {
    const channelId = customId.replace("claim_ticket_", "");
    if (!hasStaffRole(member)) return interaction.reply({ content: "❌ No permission.", ephemeral: true });
    const ticket = tickets.get(channelId);
    if (!ticket) return interaction.reply({ content: "❌ Ticket not found.", ephemeral: true });
    if (ticket.claimer) return interaction.reply({ content: "❌ Already claimed.", ephemeral: true });
    ticket.claimer = member.id;
    const embed = new EmbedBuilder().setColor(0x57f287).setTitle("✅ Ticket Claimed")
      .setDescription(`Claimed by ${member}.`).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
    await interaction.message.edit({ components: [] });
    return interaction.reply({ embeds: [embed] });
  }

  // ── Close Ticket Button ───────────────────
  if (customId.startsWith("close_ticket_")) {
    const channelId = customId.replace("close_ticket_", "");
    if (!hasStaffRole(member)) return interaction.reply({ content: "❌ No permission.", ephemeral: true });
    const ticket = tickets.get(channelId);
    if (!ticket) return interaction.reply({ content: "❌ Ticket not found.", ephemeral: true });
    ticket.closedBy = member.id;

    const transcriptCh = guild.channels.cache.get(TRANSCRIPTS_CHANNEL);
    if (transcriptCh) {
      const embed = new EmbedBuilder().setColor(0x87CEEB).setTitle("📋 Ticket Transcript")
        .addFields(
          { name: "Ticket",    value: channel.name,                                            inline: true },
          { name: "Creator",   value: `<@${ticket.creator}>`,                                 inline: true },
          { name: "Claimed By",value: ticket.claimer ? `<@${ticket.claimer}>` : "Unclaimed",  inline: true },
          { name: "Closed By", value: `<@${ticket.closedBy}>`,                                inline: true },
          { name: "Closed At", value: `<t:${Math.floor(Date.now() / 1000)}:F>`,               inline: true },
        ).setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
      await transcriptCh.send({ embeds: [embed] });
    }

    await interaction.reply({ content: "🔒 Closing in 5 seconds..." });
    setTimeout(() => channel.delete().catch(() => {}), 5000);
    tickets.delete(channelId);
    return;
  }

  // ── Mercy Buttons ─────────────────────────
  if (customId.startsWith("mercy_")) {
    const parts    = customId.split("_");
    const decision = parts[1];
    const targetId = parts[2];
    if (interaction.user.id !== targetId) return interaction.reply({ content: "❌ This message is not for you.", ephemeral: true });

    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`mercy_yes_${targetId}`).setLabel("YES").setStyle(ButtonStyle.Success).setDisabled(true),
      new ButtonBuilder().setCustomId(`mercy_no_${targetId}`).setLabel("NO").setStyle(ButtonStyle.Danger).setDisabled(true),
    );
    await interaction.message.edit({ components: [disabledRow] });

    if (decision === "yes") {
      const role = guild.roles.cache.get(ROLES.TRADER);
      if (role) await member.roles.add(role).catch(() => {});
      const embed = new EmbedBuilder().setColor(0x57f287).setTitle("✅ Verification Successful")
        .setDescription(`${member} has accepted and received the Trader role.`)
        .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
    if (decision === "no") {
      const embed = new EmbedBuilder().setColor(0xed4245).setTitle("❌ Opportunity Declined")
        .setDescription(`${member} has declined the offer.`)
        .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
  }

  // ── Confirm Buttons ───────────────────────
  if (customId.startsWith("confirm_")) {
    const parts    = customId.split("_");
    const decision = parts[1];
    const user1Id  = parts[2];
    const user2Id  = parts[3];
    if (interaction.user.id !== user1Id && interaction.user.id !== user2Id) return interaction.reply({ content: "❌ This message is not for you.", ephemeral: true });
    const ticket = tickets.get(channel.id);
    if (!ticket) return interaction.reply({ content: "❌ Ticket not found.", ephemeral: true });
    if (!ticket.confirmed) ticket.confirmed = new Set();
    if (decision === "yes") {
      ticket.confirmed.add(interaction.user.id);
      if (ticket.confirmed.has(user1Id) && ticket.confirmed.has(user2Id)) {
        const embed = new EmbedBuilder().setColor(0x57f287).setTitle("✅ Trade Confirmed")
          .setDescription(`Both <@${user1Id}> and <@${user2Id}> confirmed. Deal complete!`)
          .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
        return interaction.reply({ embeds: [embed] });
      }
      return interaction.reply({ content: "✅ Confirmed! Waiting for the other party.", ephemeral: true });
    }
    if (decision === "no") {
      const embed = new EmbedBuilder().setColor(0xed4245).setTitle("❌ Trade Declined")
        .setDescription(`${interaction.user} declined the trade.`)
        .setFooter({ text: "⚡ Powered by Titam Helper" }).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
  }
});

client.login(BOT_TOKEN);