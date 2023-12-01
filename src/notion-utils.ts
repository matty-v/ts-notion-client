import {
  BlockType,
  DbPropValue,
  NotionPageObject,
  NotionParagraphBlock,
  NotionProp,
  NotionProperties,
  NotionPropertyType,
  NotionRichTextSegment
} from './types';

export const formatPropValues = (propValues: DbPropValue[]): NotionProperties => {
  let propertiesWithValues: any = {};

  propValues.forEach(prop => {
    switch (prop.propType) {
      case NotionPropertyType.title:
        propertiesWithValues[prop.propName] = {
          title: [
            {
              text: {
                content: prop.propValue,
              },
            },
          ],
        };
        break;

      case NotionPropertyType.select:
        propertiesWithValues[prop.propName] = {
          select: {
            name: prop.propValue,
          },
        };

        break;

      case NotionPropertyType.multi_select:
        propertiesWithValues[prop.propName] = {
          multi_select: prop.propValue.split(',').map(v => {
            return { name: v };
          }),
        };

        break;
      case NotionPropertyType.rich_text:
        propertiesWithValues[prop.propName] = {
          rich_text: [
            {
              text: {
                content: prop.propValue,
              },
            },
          ],
        };

        break;

      case NotionPropertyType.url:
        propertiesWithValues[prop.propName] = {
          url: prop.propValue,
        };

        break;

      case NotionPropertyType.number:
        propertiesWithValues[prop.propName] = {
          number: Number.parseInt(prop.propValue),
        };

        break;

      case NotionPropertyType.status:
        propertiesWithValues[prop.propName] = {
          status: {
            name: prop.propValue,
          },
        };

        break;

      case NotionPropertyType.checkbox:
        propertiesWithValues[prop.propName] = {
          checkbox: prop.propValue === 'true' ? true : false,
        };

        break;

      case NotionPropertyType.date:
        const newDate = new Date(prop.propValue);
        const offset = newDate.getTimezoneOffset();
        const d = new Date(newDate.getTime() - offset * 60 * 1000);
        const datePropVal = d.toISOString().split('T')[0];

        propertiesWithValues[prop.propName] = {
          date: {
            start: datePropVal,
            end: null,
            time_zone: null,
          },
        };

        break;

      default:
        break;
    }
  });

  return propertiesWithValues;
};

export const convertMarkdownToBlocks = (markdownContent: string): NotionParagraphBlock[] | null => {
  if (!markdownContent) return null;

  const markdownConverterRules = [
    {
      key: 'link',
      regex: /\[([^\[\]]*)\]\((.*?)\)/g,
      formatter: formatLinkSegment,
    },
  ];

  const blocks: NotionParagraphBlock[] = [];

  markdownContent.split('\n').forEach(line => {
    if (line.trim()) {
      const segments: NotionRichTextSegment[] = [];
      const specialSegments: { key: number; segment: NotionRichTextSegment }[] = [];
      let counter = 0;

      for (let rule of markdownConverterRules) {
        const matches = line.match(rule.regex);
        if (matches && matches.length > 0) {
          for (let match of matches) {
            counter++;
            const segment = rule.formatter(match);
            if (segment) {
              specialSegments.push({
                key: counter,
                segment,
              });
              line = line.replace(match, `$((${counter}))`);
            }
          }
        }
      }

      while (line.length > 0) {
        const textMatches = line.match(/^(.*?)\$\(\(/);
        if (textMatches && textMatches.length > 0 && textMatches[1]) {
          segments.push(formatTextSegment(textMatches[1]));
          line = line.replace(textMatches[1], '');
        } else {
          const specialSegmentMatches = line.match(/\$\(\((.*?)\)\)/);
          if (specialSegmentMatches && specialSegmentMatches.length > 0 && specialSegmentMatches[1]) {
            const key = parseInt(specialSegmentMatches[1]);
            segments.push(specialSegments.find(s => s.key === key).segment);
            line = line.replace(/\$\(\(.*?\)\)/, '');
          } else {
            segments.push(formatTextSegment(line));
            break;
          }
        }
      }

      blocks.push({
        object: 'block',
        type: BlockType.paragraph,
        paragraph: {
          rich_text: segments,
        },
      });
    }
  });

  return blocks;
};

export const formatTextSegment = (text: string): NotionRichTextSegment => {
  return {
    type: 'text',
    text: {
      content: shortenString(text, 2000),
    },
  };
};

export const formatLinkSegment = (text: string): NotionRichTextSegment | null => {
  const matches = text.match(/\[(.+)\]\((.+)\)/);

  if (!matches || matches.length < 3 || !matches[1] || !matches[2]) {
    return null;
  }

  let linkText = matches[1];
  let linkUrl = matches[2];

  if (!isValidUrl(linkUrl)) return null;

  return {
    type: 'text',
    text: {
      content: linkText,
      link: {
        url: linkUrl,
      },
    },
    plain_text: linkText,
    href: linkUrl,
  };
};

export const getPropValueFromPage = (
  page: NotionPageObject,
  propType: NotionPropertyType,
  propName: string,
): string => {
  let propValue = '';

  const prop: NotionProp = page.properties[propName];
  if (!prop) {
    console.error(`No ${propName} property found in page object`);
    console.error(JSON.stringify(page, null, 2));
    return propValue;
  }

  try {
    switch (propType) {
      case NotionPropertyType.rich_text:
        propValue = prop.rich_text[0].plain_text;
        break;

      default:
        break;
    }
  } catch (e) {
    console.error(e);
    return propValue;
  }

  return propValue;
};

const isValidUrl = (url: string): boolean => {
  let testUrl: URL;
  try {
    testUrl = new URL(url);
  } catch (_) {
    return null;
  }

  return testUrl.protocol === 'http:' || testUrl.protocol === 'https:';
};

const shortenString = (str: string, numChars: number): string => {
  if (str.length < numChars) return str;
  return `${str.substring(0, numChars - 3)}...`;
};
