
export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  ARCHIVED = 'archived',
  WAITING_FLOW = 'waiting_flow'
}

export interface ResponsiveStyle {
  // Mobile overrides
  fontSize?: string;
  lineHeight?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  marginTop?: string;
  marginBottom?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  width?: string;
  display?: 'block' | 'none' | 'inline-block';
  height?: string;
}

export interface EmailBlockStyle {
  // Background
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: 'cover' | 'contain' | 'auto';
  backgroundPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
  contentBackgroundColor?: string; 
  
  // Typography
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: string;
  letterSpacing?: string;
  
  // Spacing (Desktop)
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;

  // Box Model
  width?: string;
  maxWidth?: string;
  height?: string;
  
  // Border
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderColor?: string;
  borderTopWidth?: string;
  borderBottomWidth?: string;
  borderLeftWidth?: string;
  borderRightWidth?: string;
  
  // Radius
  borderRadius?: string;
  borderTopLeftRadius?: string;
  borderTopRightRadius?: string;
  borderBottomLeftRadius?: string;
  borderBottomRightRadius?: string;
  
  // Shadow
  shadowBlur?: string;
  shadowColor?: string;
  shadowSpread?: string;
  shadowX?: string;
  shadowY?: string;

  // Layout
  verticalAlign?: 'top' | 'middle' | 'bottom';
  display?: string; 

  // Specific Component Styles
  iconColor?: string;
  iconBackgroundColor?: string;
  iconSize?: string; 
  iconMode?: 'color' | 'dark' | 'light' | 'custom';
  gap?: string; 
  
  // Advanced Features
  targetDate?: string; // For countdown
  digitColor?: string;
  labelColor?: string;
  
  timelineDotColor?: string;
  timelineLineColor?: string;
  timelineLineStyle?: 'solid' | 'dashed' | 'dotted';

  starSize?: string;
  starColor?: string;

  quoteBorderColor?: string;
  quoteBorderStyle?: 'solid' | 'dashed' | 'dotted';
  quoteBorderWidth?: string;

  // Mobile Overrides (Crucial for Responsive)
  mobile?: ResponsiveStyle;
}

export interface SocialLink {
  id: string;
  network: string; 
  url: string;
  imageUrl?: string;
  customStyle?: {
      iconColor?: string;
      backgroundColor?: string;
  };
}

export interface ListItem {
    id: string;
    title: string;
    description: string;
    date?: string;
    icon?: string;
    productName?: string;
    quantity?: number;
    price?: number;
}

export type EmailBlockType = 'section' | 'row' | 'column' | 'text' | 'image' | 'button' | 'spacer' | 'divider' | 'social' | 'video' | 'html' | 'countdown' | 'quote' | 'timeline' | 'review' | 'order_list';

export interface EmailBlock {
  id: string;
  type: EmailBlockType;
  content: string; 
  url?: string; 
  altText?: string; 
  videoUrl?: string; 
  thumbnailUrl?: string; 
  socialLinks?: SocialLink[]; 
  items?: ListItem[]; 
  rating?: number; 
  style: EmailBlockStyle;
  children?: EmailBlock[]; 
}

export interface EmailBodyStyle {
  backgroundColor: string;
  contentWidth: string; 
  contentBackgroundColor: string; 
  fontFamily: string; 
  linkColor: string; 
  backgroundImage?: string;
}

export interface Template {
  id: string;
  name: string;
  thumbnail: string;
  category: 'newsletter' | 'promotional' | 'transactional' | 'welcome' | 'event' | 'empty';
  lastModified: string;
  blocks: EmailBlock[]; 
  bodyStyle: EmailBodyStyle; 
  htmlContent?: string; 
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface SubscriberNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface Attachment { id: string; name: string; url: string; size: number; type: string; logic: 'all' | 'match_email'; }
export interface CampaignReminder { id: string; type: 'no_open' | 'no_click' | 'always'; triggerMode: 'delay' | 'date'; delayDays: number; delayHours: number; scheduledAt: string; subject: string; templateId: string; }
export interface Campaign { id: string; name: string; subject: string; status: CampaignStatus; sentAt?: string; scheduledAt?: string; createdAt?: string; target: { listIds: string[]; segmentIds: string[]; tagIds: string[]; individualIds: string[]; }; reminders: CampaignReminder[]; senderEmail: string; trackingEnabled: boolean; stats?: { sent: number; opened: number; clicked: number; bounced: number; spam: number; }; contentBody?: string; templateId?: string; attachments?: Attachment[]; }
export interface Subscriber { id: string; email: string; firstName: string; lastName: string; status: 'active' | 'unsubscribed'; tags: string[]; joinedAt: string; dateOfBirth?: string | null; anniversaryDate?: string | null; listIds: string[]; notes: SubscriberNote[]; stats: { emailsSent: number; emailsOpened: number; linksClicked: number; lastOpenAt?: string; lastClickAt?: string; }; customAttributes: Record<string, any>; gender?: string; phoneNumber?: string; jobTitle?: string; companyName?: string; country?: string; city?: string; source?: string; activity?: any[]; }
export interface Segment { id: string; name: string; description: string; count: number; criteria: string; autoCleanupDays?: number; }
export interface FlowStep { id: string; type: 'trigger' | 'action' | 'wait' | 'condition' | 'split_test' | 'link_flow' | 'remove_action' | 'update_tag' | 'list_action'; label: string; iconName: string; config: Record<string, any>; nextStepId?: string; yesStepId?: string; noStepId?: string; pathAStepId?: string; pathBStepId?: string; }
export interface Flow { id: string; name: string; description: string; status: 'active' | 'paused' | 'draft' | 'archived'; steps: FlowStep[]; stats: { enrolled: number; completed: number; openRate: number; clickRate: number; totalSent: number; totalOpened: number; }; config: { frequencyCap: number; activeDays: number[]; startTime: string; endTime: string; exitConditions: string[]; type: 'realtime' | 'batch'; }; createdAt: string; archivedAt?: string; }
export interface FormField { id: string; dbField: string; label: string; required: boolean; type: 'text' | 'email' | 'tel' | 'number' | 'date'; }
export interface FormDefinition { id: string; name: string; targetListId: string; fields: FormField[]; stats?: { submissions: number; }; }
export interface PurchaseEvent { id: string; name: string; stats?: { count: number; }; }
export interface CustomEvent { id: string; name: string; stats?: { count: number; }; }
