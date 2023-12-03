import { writeFile } from 'node:fs/promises';
import { join } from 'path';
import { archivePage, createPageInDatabase, fetchDatabaseById, fetchPageById, fetchPageContent, fetchPagesInDatabase } from '../notion-client';
import { convertBlocksToMarkdown } from '../notion-utils';
import { DbPropValue, NotionPropertyType } from '../types';

export const run = async () => {

  console.log('Running the ts-notion-client e2e test...');

  const notionApiKey = process.env.NOTION_API_KEY ?? '';
  const testDbId = process.env.TEST_DB_ID ?? '';
  const testPageId = process.env.TEST_PAGE_ID ?? '';
  const testDbPageId = process.env.TEST_DB_PAGE_ID ?? '';

  if (!notionApiKey) {
    throw new Error('NOTION_API_KEY env var not set!')
  }

  const database = await fetchDatabaseById(notionApiKey, testDbId);
  await writeToFile('fetchDatabaseById.json', JSON.stringify(database, null, 2));

  const fetchedDbPages = await fetchPagesInDatabase(notionApiKey, database.id);
  await writeToFile('fetchPagesInDatabase.json', JSON.stringify(fetchedDbPages, null, 2));

  const newDbPage = await createPageInDatabase(notionApiKey, database.id, createTestPageProperties(), 'E2E DB test page test content');
  await writeToFile('createPageInDatabase.json', JSON.stringify(newDbPage, null, 2));

  const fetchedPage = await fetchPageById(notionApiKey, testPageId);
  await writeToFile('fetchPageById.json', JSON.stringify(fetchedPage, null, 2));

  const pageContent = await fetchPageContent(notionApiKey, fetchedPage.id);
  await writeToFile('fetchPageContent.json', JSON.stringify(pageContent, null, 2));

  const convertedMarkdown = convertBlocksToMarkdown(pageContent);
  await writeToFile('convertBlocksToMarkdown.md', convertedMarkdown);

  const archivedPage = await archivePage(notionApiKey, newDbPage.id);
  await writeToFile('archivePage.json', JSON.stringify(archivedPage, null, 2));

  console.log('ts-notion-client e2e test is complete!');
};

const writeToFile = async (filename: string, content: string) => {
  try {
    await writeFile(join(__dirname, '../../test_output/', filename), content);
  } catch (err) {
    console.log(err);
  }
}

const createTestPageProperties = (): DbPropValue[] => {
  const dbPropVals: DbPropValue[] = [];
  dbPropVals.push({
    propName: "Name",
    propType: NotionPropertyType.title,
    propValue: 'e2e-test page'
  });
  dbPropVals.push({
    propName: "Tags",
    propType: NotionPropertyType.multi_select,
    propValue: 'tag 1, tag 2'
  });
  dbPropVals.push({
    propName: "Select",
    propType: NotionPropertyType.select,
    propValue: 'Option 2'
  });
  dbPropVals.push({
    propName: "Description",
    propType: NotionPropertyType.rich_text,
    propValue: 'this is an e2e generated test page'
  });
  dbPropVals.push({
    propName: "Date",
    propType: NotionPropertyType.date,
    propValue: '2023-12-01'
  });
  dbPropVals.push({
    propName: "Number",
    propType: NotionPropertyType.number,
    propValue: '2'
  });
  dbPropVals.push({
    propName: "Checkbox",
    propType: NotionPropertyType.checkbox,
    propValue: 'true'
  });
  return dbPropVals;
}
