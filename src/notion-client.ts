import axios, { AxiosRequestConfig } from 'axios';
import { convertMarkdownToBlocks, formatPropValues } from './notion-utils';
import { DbPropValue, NotionBlock, NotionDatabaseObject, NotionPageObject, NotionParagraphBlock, NotionProperties } from './types';

const notionApiUrl = 'https://api.notion.com/v1';
const notionVersion = '2022-06-28';

export const createPageInDatabaseRequest = (
  apiToken: string,
  database_id: string,
  propValues: DbPropValue[],
  markdownContent: string,
): AxiosRequestConfig => {
  const parent = { database_id };
  const properties = formatPropValues(propValues);
  const paragraphBlocks = convertMarkdownToBlocks(markdownContent);
  const content = paragraphBlocks === null ? null : { children: paragraphBlocks };

  return createNewPageRequest(apiToken, parent, properties, content);
};

export const createPageInDatabase = async (
  apiToken: string,
  database_id: string,
  propValues: DbPropValue[],
  markdownContent: string,
): Promise<NotionPageObject> => {
  const parent = { database_id };
  const properties = formatPropValues(propValues);
  const paragraphBlocks = convertMarkdownToBlocks(markdownContent);
  const content = paragraphBlocks === null ? null : { children: paragraphBlocks };

  return await createNewPage(apiToken, parent, properties, content);
};

export const createNewPageRequest = (
  apiToken: string,
  parent: { database_id: string },
  properties: NotionProperties,
  content?: { children: NotionParagraphBlock[] } | null,
): AxiosRequestConfig => {
  const requestBody = {
    parent,
    properties,
    ...(content && content),
  };

  return {
    url: `${notionApiUrl}/pages`,
    method: 'post',
    headers: addHeaders(apiToken),
    data: requestBody
  };
};

export const createNewPage = async (
  apiToken: string,
  parent: { database_id: string },
  properties: NotionProperties,
  content?: { children: NotionParagraphBlock[] } | null,
): Promise<NotionPageObject> => {
  let createdPage: NotionPageObject;
  try {
    const requestConfig = createNewPageRequest(apiToken, parent, properties, content);
    const response = await axios(requestConfig);
    createdPage = response.data;
  } catch (e) {
    console.log('Failed to create new page!');
    throw e;
  }

  return createdPage;
};

export const archivePageRequest = (apiToken: string, pageId: string): AxiosRequestConfig => {

  return {
    url: `${notionApiUrl}/pages/${pageId}`,
    method: 'patch',
    headers: addHeaders(apiToken),
    data: {
      archived: true
    }
  };
};

export const archivePage = async (apiToken: string, pageId: string): Promise<NotionPageObject> => {

  let page: NotionPageObject;

  try {
    const response = await axios(archivePageRequest(apiToken, pageId));
    page = response.data;
  } catch (e) {
    console.log(`Failed to archive page with ID [${pageId}]`);
    throw e;
  }

  return page;
};

export const fetchPagesInDatabaseRequest = (
  apiToken: string,
  databaseId: string,
  start_cursor: string = '',
): AxiosRequestConfig => {

  return {
    url: `${notionApiUrl}/databases/${databaseId}/query`,
    method: 'post',
    headers: addHeaders(apiToken),
    data: {
      ...(start_cursor && { start_cursor }),
    }
  };
};

export const fetchPagesInDatabase = async (
  apiToken: string,
  databaseId: string,
  existingPages: NotionPageObject[] = [],
  start_cursor: string = '',
): Promise<NotionPageObject[]> => {
  let pages: NotionPageObject[] = existingPages;

  try {
    const response = await axios(fetchPagesInDatabaseRequest(apiToken,databaseId,start_cursor));
    pages.push(...response.data.results);

    if (response.data['has_more']) {
      console.log('fetching more results...');
      await fetchPagesInDatabase(apiToken, databaseId, existingPages, response.data['next_cursor']);
    }
  } catch (e) {
    console.log(`Failed to fetch pages for database with ID [${databaseId}]`);
    throw e;
  }

  return pages;
};

export const fetchDatabaseByIdRequest = (apiToken: string, databaseId: string): AxiosRequestConfig => {
  return {
    url: `${notionApiUrl}/databases/${databaseId}`,
    method: 'get',
    headers: addHeaders(apiToken)
  };
}

export const fetchDatabaseById = async (apiToken: string, databaseId: string): Promise<NotionDatabaseObject> => {

  let db: NotionDatabaseObject;

  try {
    const response = await axios(fetchDatabaseByIdRequest(apiToken, databaseId));
    db = response.data;
  } catch (e) {
    console.log(`Failed to fetch database with ID [${databaseId}]`);
    throw e;
  }

  return db;
}

export const fetchPageByIdRequest = (apiToken: string, pageId: string): AxiosRequestConfig => {
  return {
    url: `${notionApiUrl}/pages/${pageId}`,
    method: 'get',
    headers: addHeaders(apiToken)
  };
}

export const fetchPageById = async (apiToken: string, pageId: string): Promise<NotionPageObject> => {

  let page: NotionPageObject;

  try {
    const response = await axios(fetchPageByIdRequest(apiToken, pageId));
    page = response.data;
  } catch (e) {
    console.log(`Failed to fetch page with ID [${pageId}]`);
    throw e;
  }

  return page;
}

export const fetchPageContentRequest = (apiToken: string, pageId: string, start_cursor: string = ''): AxiosRequestConfig => {

  let url = `${notionApiUrl}/blocks/${pageId}/children?page_size=100`;
  if (start_cursor) {
    url += `&start_cursor=${start_cursor}`;
  }

  return {
    url,
    method: 'get',
    headers: addHeaders(apiToken)
  };
}

export const fetchPageContent = async (
  apiToken: string,
  pageId: string,
  existingBlocks: NotionBlock[] = [],
  start_cursor: string = ''
): Promise<NotionBlock[]> => {
  const pageContent: NotionBlock[] = existingBlocks;

  try {
    const response = await axios(fetchPageContentRequest(apiToken, pageId, start_cursor));
    pageContent.push(...response.data.results);

    if (response.data['has_more']) {
      console.log('fetching more page content...');
      await fetchPageContent(apiToken, pageId, existingBlocks, response.data['next_cursor']);
    }
  } catch (e) {
    console.log(`Failed to fetch page content for page with ID [${pageId}]`);
    throw e;
  }

  return pageContent;
}

const addHeaders = (apiToken: string): any => {
  return {
    'Notion-Version': notionVersion,
    Authorization: `Bearer ${apiToken}`
  };
};
