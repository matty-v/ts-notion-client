export enum NotionPropertyType {
  title = 'title',
  multi_select = 'multi_select',
  date = 'date',
  select = 'select',
  rich_text = 'rich_text',
  status = 'status',
  url = 'url',
  number = 'number',
  last_edited_time = 'last_edited_time',
  created_time = 'created_time',
  checkbox = 'checkbox',
  phone_number = 'phone_number',
  people = 'people',
  files = 'files',
}

export enum ItemType {
  page = 'page',
  database = 'database',
}

export enum ParentType {
  workspace = 'workspace',
  page_id = 'page_id',
  database_id = 'database_id',
}

export enum IconType {
  emoji = 'emoji',
  external = 'external',
}

type NotionObject = {
  id: string;
  created_time: string;
  last_edited_time: string;
  parent?: NotionDatabaseParent | NotionPageParent | NotionWorkspaceParent;
  properties: NotionProperties;
  url: string;
  icon: IconProp | null;
};

export type NotionPageOrDatabaseObject = NotionObject & (NotionPageObject | NotionDatabaseObject);

export type NotionPageObject = NotionObject & {
  object: ItemType.page;
};

export type NotionDatabaseObject = NotionObject & {
  object: ItemType.database;
  title: NotionTitle[];
};

export type NotionDatabaseParent = {
  type: ParentType.database_id;
  database_id: string;
};

export type NotionPageParent = {
  type: ParentType.page_id;
  page_id: string;
};

export type NotionWorkspaceParent = {
  type: ParentType.workspace;
  workspace: boolean;
};

export type NotionTitle = {
  type: string;
  text?: {};
  annotations?: {};
  href?: any;
  plain_text: string;
};

export type NotionProperties = {
  [key: string]: NotionProp;
};

export type NotionProp = {
  id: string;
  type: NotionPropertyType;
  name?: string;
};

export type NotionRichTextProp = NotionProp & {
  rich_text: NotionRichTextSegment[];
}

export type NotionStatusProp = NotionProp & {
  status: {
    options: NotionSelectOption[];
  } | NotionSelectOption;
};

export type NotionSelectProp = NotionProp & {
  select: {
    options: NotionSelectOption[];
  } | NotionSelectOption;
};

export type NotionMultiSelectProp = NotionProp & {
  multi_select: {
    options: NotionSelectOption[];
  } | NotionSelectOption[];
};

export type NotionTitleProp = NotionProp & {
  title: NotionTitle[] | {};
};

export type NotionCheckboxProp = NotionProp & {
  checkbox: boolean;
}

export type NotionNumberProp = NotionProp & {
  number: number;
}

export type NotionDateProp = NotionProp & {
  date: {
    start: string; // "2023-11-30"
    end: string | null;
    time_zone: string | null;
  }
}

export type NotionLastEditedTimeProp = NotionProp & {
  last_edited_time: string | {};
}

export type NotionCreatedTimeProp = NotionProp & {
  created_time: string | {};
}

export type NotionSelectOption = {
  id: string;
  name: string;
  color: string;
};

export type NotificationPayload = {
  Message: string;
  LinkName?: string;
  LinkUrl?: string;
};

export type IconProp = {
  type: IconType;
  emoji?: string;
  external?: {
    url: string;
  };
};

export type NotionBlock = {
  object: 'block';
  type: NotionBlockType;
};

export type NotionParagraphBlock = NotionBlock & {
  paragraph: {
    rich_text: NotionRichTextSegment[];
  };
};

export type NotionHeading1Block = NotionBlock & {
  heading_1: {
    rich_text: NotionRichTextSegment[];
  };
};

export type NotionHeading2Block = NotionBlock & {
  heading_2: {
    rich_text: NotionRichTextSegment[];
  };
};

export type NotionHeading3Block = NotionBlock & {
  heading_3: {
    rich_text: NotionRichTextSegment[];
  };
};

export type NotionBulletedListItemBlock = NotionBlock & {
  bulleted_list_item: {
    rich_text: NotionRichTextSegment[];
  };
};

export type NotionRichTextSegment = {
  type: 'text';
  text: {
    content: string;
    link?: {
      url: string;
    };
  };
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
  plain_text?: string;
  href?: string;
};

export enum NotionBlockType {
  paragraph = 'paragraph',
  heading_1 = 'heading_1',
  heading_2 = 'heading_2',
  heading_3 = 'heading_3',
  bulleted_list_item = 'bulleted_list_item'
}

export type DbPropValue = {
  propName: string;
  propValue: string;
  propType: NotionPropertyType;
};
