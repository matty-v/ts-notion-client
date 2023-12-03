import { describe, expect, test } from '@jest/globals';
import { convertBlocksToMarkdown, convertMarkdownToBlocks, convertRichTextSegmentsToMarkdown, formatLinkSegment, formatPropValues, getPropValueFromPage } from '../notion-utils';
import { DbPropValue, NotionBlock, NotionBlockType, NotionPageObject, NotionParagraphBlock, NotionPropertyType, NotionRichTextSegment } from '../types';

const createDbPropValue = (propType: NotionPropertyType, propVal?: string): DbPropValue => {
  return {
    propType,
    propName: propType.toString() + '-name',
    propValue: propVal ?? propType.toString() + '-value',
  };
};

describe('Format Prop Values', () => {
  test('formats title property', () => {
    const titlePropVal = createDbPropValue(NotionPropertyType.title);
    let expectedProp = {};
    expectedProp[titlePropVal.propName] = {
      title: [
        {
          text: {
            content: titlePropVal.propValue,
          },
        },
      ],
    };

    expect(formatPropValues([titlePropVal])).toStrictEqual(expectedProp);
  });

  test('formats select property', () => {
    const selectPropVal = createDbPropValue(NotionPropertyType.select);
    let expectedProp = {};
    expectedProp[selectPropVal.propName] = {
      select: {
        name: selectPropVal.propValue,
      },
    };

    expect(formatPropValues([selectPropVal])).toStrictEqual(expectedProp);
  });

  test('formats multi_select property', () => {
    const multiSelectPropVal = createDbPropValue(NotionPropertyType.multi_select, 'option1,option2,option3');
    let expectedProp = {};
    expectedProp[multiSelectPropVal.propName] = {
      multi_select: multiSelectPropVal.propValue.split(',').map(v => {
        return { name: v };
      }),
    };

    expect(formatPropValues([multiSelectPropVal])).toStrictEqual(expectedProp);
  });

  test('formats rich_text property', () => {
    const richTextPropVal = createDbPropValue(NotionPropertyType.rich_text);
    let expectedProp = {};
    expectedProp[richTextPropVal.propName] = {
      rich_text: [
        {
          text: {
            content: richTextPropVal.propValue,
          },
        },
      ],
    };

    expect(formatPropValues([richTextPropVal])).toStrictEqual(expectedProp);
  });

  test('formats url property', () => {
    const urlPropVal = createDbPropValue(NotionPropertyType.url);
    let expectedProp = {};
    expectedProp[urlPropVal.propName] = {
      url: urlPropVal.propValue,
    };

    expect(formatPropValues([urlPropVal])).toStrictEqual(expectedProp);
  });

  test('formats number property', () => {
    const numberPropVal = createDbPropValue(NotionPropertyType.number);
    let expectedProp = {};
    expectedProp[numberPropVal.propName] = {
      number: Number.parseInt(numberPropVal.propValue),
    };

    expect(formatPropValues([numberPropVal])).toStrictEqual(expectedProp);
  });

  test('formats status property', () => {
    const statusPropVal = createDbPropValue(NotionPropertyType.status);
    let expectedProp = {};
    expectedProp[statusPropVal.propName] = {
      status: {
        name: statusPropVal.propValue,
      },
    };

    expect(formatPropValues([statusPropVal])).toStrictEqual(expectedProp);
  });

  test('formats checkbox property', () => {
    const checkboxPropVal = createDbPropValue(NotionPropertyType.checkbox);
    let expectedProp = {};
    expectedProp[checkboxPropVal.propName] = {
      checkbox: checkboxPropVal.propValue === 'true' ? true : false,
    };

    expect(formatPropValues([checkboxPropVal])).toStrictEqual(expectedProp);
  });

  test('formats date property', () => {
    const datePropVal = createDbPropValue(NotionPropertyType.date, '2023-06-28');

    const newDate = new Date(datePropVal.propValue);
    const offset = newDate.getTimezoneOffset();
    const d = new Date(newDate.getTime() - offset * 60 * 1000);
    const val = d.toISOString().split('T')[0];

    let expectedProp = {};
    expectedProp[datePropVal.propName] = {
      date: {
        start: val,
        end: null,
        time_zone: null,
      },
    };

    expect(formatPropValues([datePropVal])).toStrictEqual(expectedProp);
  });
});

describe('Get Property Value from Page', () => {
  test('gets a title property value', () => {
    const titleVal = getPropValueFromPage(testPage as NotionPageObject, NotionPropertyType.title, 'Name');
    expect(titleVal).toBe('e2e-test page');
  });
  test('gets a rich_text property value', () => {
    const richTextVal = getPropValueFromPage(testPage as NotionPageObject, NotionPropertyType.rich_text, 'Description');
    expect(richTextVal).toBe('this is an e2e generated test page');
  });
  test('gets a multi_select property value', () => {
    const multiSelectVal = getPropValueFromPage(testPage as NotionPageObject, NotionPropertyType.multi_select, 'Tags');
    expect(multiSelectVal).toBe('tag 1, tag 2');
  });
  test('gets a select property value', () => {
    const selectVal = getPropValueFromPage(testPage as NotionPageObject, NotionPropertyType.select, 'Select');
    expect(selectVal).toBe('Option 2');
  });
  test('gets a date property value', () => {
    const dateVal = getPropValueFromPage(testPage as NotionPageObject, NotionPropertyType.date, 'Date');
    expect(dateVal).toBe('2023-11-30');
  });
  test('gets a last_edited_time property value', () => {
    const lastEditedTimeVal = getPropValueFromPage(testPage as NotionPageObject, NotionPropertyType.last_edited_time, 'Last edited time');
    expect(lastEditedTimeVal).toBe('2023-12-01T03:10:00.000Z');
  });
  test('gets a created_time property value', () => {
    const createdTimeVal = getPropValueFromPage(testPage as NotionPageObject, NotionPropertyType.created_time, 'Created time');
    expect(createdTimeVal).toBe('2023-11-30T23:32:00.000Z');
  });
  test('gets a number property value', () => {
    const numberVal = getPropValueFromPage(testPage as NotionPageObject, NotionPropertyType.number, 'Number');
    expect(numberVal).toBe('2');
  });
  test('gets a checkbox property value', () => {
    const checkboxVal = getPropValueFromPage(testPage as NotionPageObject, NotionPropertyType.checkbox, 'Checkbox');
    expect(checkboxVal).toBe('false');
  });
});

describe('Converts markdown to blocks', () => {
  test('convert markdown', () => {
    const markdown = `Some *text* and [sail however happily](https://impractical-fat.com) more [alongside apud hm](https://jumpy-wall.name)`;

    const expectedBlocks: NotionParagraphBlock[] = [
      {
        object: 'block',
        type: NotionBlockType.paragraph,
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: 'Some *text* and ',
              },
            },
            {
              type: 'text',
              text: {
                content: 'sail however happily',
                link: {
                  url: 'https://impractical-fat.com',
                },
              },
              plain_text: 'sail however happily',
              href: 'https://impractical-fat.com',
            },
            {
              type: 'text',
              text: {
                content: ' more ',
              },
            },
            {
              type: 'text',
              text: {
                content: 'alongside apud hm',
                link: {
                  url: 'https://jumpy-wall.name',
                },
              },
              plain_text: 'alongside apud hm',
              href: 'https://jumpy-wall.name',
            },
          ],
        },
      },
    ];

    const blocks = convertMarkdownToBlocks(markdown);

    expect(blocks).toStrictEqual(expectedBlocks);
  });
  test('handles no content', () => {
    const actualBlock = convertMarkdownToBlocks('');
    expect(actualBlock).toBe(null);
  });
  test('handles simple text content', () => {
    const actualBlocks = convertMarkdownToBlocks('Hello here is a single line of text');

    const expectedBlocks = [
      {
        object: 'block',
        type: NotionBlockType.paragraph,
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: 'Hello here is a single line of text',
              },
            },
          ],
        },
      },
    ];
    expect(actualBlocks).toStrictEqual(expectedBlocks);
  });
  test('handles line breaks', () => {
    const actualBlocks = convertMarkdownToBlocks('\nHello here are a \n\r\nfew lines of text\n \n\n\r');

    const expectedBlocks = [
      {
        object: 'block',
        type: NotionBlockType.paragraph,
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: 'Hello here are a ',
              },
            },
          ],
        },
      } as NotionParagraphBlock,
      {
        object: 'block',
        type: NotionBlockType.paragraph,
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: 'few lines of text',
              },
            },
          ],
        },
      } as NotionParagraphBlock,
    ];

    expect(actualBlocks).toStrictEqual(expectedBlocks);
  });
  test('handles bold', () => {});
  test('handles underline', () => {});
  test('handles italics', () => {});
  test('handles headers', () => {});
  test('handles paragraphs', () => {});
  test('format link segments', () => {
    const linkText = '[Link Text](https://this.is.a.link)';
    const expectedLinkSegment = {
      type: 'text',
      text: {
        content: 'Link Text',
        link: {
          url: 'https://this.is.a.link',
        },
      },
      plain_text: 'Link Text',
      href: 'https://this.is.a.link',
    };

    const linkSegment = formatLinkSegment(linkText);

    expect(linkSegment).toStrictEqual(expectedLinkSegment);
  });
  test('handles images', () => {});
});

describe('Converts blocks to markdown', () => {
  test('convert blocks', () => {

    const expectedMarkdown = "# Heading *1*\n## Heading **2**\n### Heading 3\n- **Bold** and *italics*\nOne more **bold**\n";

    const blocks = [
      {
        object: 'block',
        type: NotionBlockType.heading_1,
        heading_1: {
          rich_text: [
            {
              type: 'text',
              annotations: {
                bold: false,
                italic: false,
                code: false,
                color: 'default',
                strikethrough: false,
                underline: false
              },
              text: {
                content: 'Heading '
              },
              plain_text: 'Heading '
            },
            {
              type: 'text',
              annotations: {
                bold: false,
                italic: true,
                code: false,
                color: 'default',
                strikethrough: false,
                underline: false
              },
              text: {
                content: '1'
              },
              plain_text: '1'
            }
          ]
        }
      },
      {
        object: 'block',
        type: NotionBlockType.heading_2,
        heading_2: {
          rich_text: [
            {
              type: 'text',
              annotations: {
                bold: false,
                italic: false,
                code: false,
                color: 'default',
                strikethrough: false,
                underline: false
              },
              text: {
                content: 'Heading '
              },
              plain_text: 'Heading '
            },
            {
              type: 'text',
              annotations: {
                bold: true,
                italic: false,
                code: false,
                color: 'default',
                strikethrough: false,
                underline: false
              },
              text: {
                content: '2'
              },
              plain_text: '2'
            }
          ]
        }
      },
      {
        object: 'block',
        type: NotionBlockType.heading_3,
        heading_3: {
          rich_text: [
            {
              type: 'text',
              annotations: {
                bold: false,
                italic: false,
                code: false,
                color: 'default',
                strikethrough: false,
                underline: false
              },
              text: {
                content: 'Heading 3'
              },
              plain_text: 'Heading 3'
            }
          ]
        }
      },
      {
        object: 'block',
        type: NotionBlockType.bulleted_list_item,
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              annotations: {
                bold: true,
                italic: false,
                code: false,
                color: 'default',
                strikethrough: false,
                underline: false
              },
              text: {
                content: 'Bold'
              },
              plain_text: 'Bold'
            },
            {
              type: 'text',
              annotations: {
                bold: false,
                italic: false,
                code: false,
                color: 'default',
                strikethrough: false,
                underline: false
              },
              text: {
                content: ' and '
              },
              plain_text: ' and '
            },
            {
              type: 'text',
              annotations: {
                bold: false,
                italic: true,
                code: false,
                color: 'default',
                strikethrough: false,
                underline: false
              },
              text: {
                content: 'italics'
              },
              plain_text: 'italics'
            }
          ]
        }
      },
      {
        object: 'block',
        type: NotionBlockType.paragraph,
        paragraph: {
          rich_text: [
            {
              type: 'text',
              annotations: {
                bold: false,
                italic: false,
                code: false,
                color: 'default',
                strikethrough: false,
                underline: false
              },
              text: {
                content: 'One more '
              },
              plain_text: 'One more '
            },
            {
              type: 'text',
              annotations: {
                bold: true,
                italic: false,
                code: false,
                color: 'default',
                strikethrough: false,
                underline: false
              },
              text: {
                content: 'bold'
              },
              plain_text: 'bold'
            }
          ]
        }
      }
    ]

    const markdown = convertBlocksToMarkdown(blocks as NotionBlock[]);

    expect(markdown).toBe(expectedMarkdown);

  });
  test('convert rich text segments to markdown', () => {
    const richTextSegments: NotionRichTextSegment[] = [
      {
        type: 'text',
        annotations: {
          bold: false,
          italic: false,
          code: false,
          color: 'default',
          strikethrough: false,
          underline: false
        },
        text: {
          content: 'This '
        },
        plain_text: 'This '
      },
      {
        type: 'text',
        annotations: {
          bold: true,
          italic: false,
          code: false,
          color: 'default',
          strikethrough: false,
          underline: false
        },
        text: {
          content: 'is a'
        },
        plain_text: 'is a'
      },
      {
        type: 'text',
        annotations: {
          bold: false,
          italic: false,
          code: false,
          color: 'default',
          strikethrough: false,
          underline: false
        },
        text: {
          content: ' '
        },
        plain_text: ' '
      },
      {
        type: 'text',
        annotations: {
          bold: false,
          italic: true,
          code: false,
          color: 'default',
          strikethrough: false,
          underline: false
        },
        text: {
          content: 'paragraph'
        },
        plain_text: 'paragraph'
      },
    ]

    const markdown = convertRichTextSegmentsToMarkdown(richTextSegments);

    expect(markdown).toBe('This **is a** *paragraph*');
  });
})

const testPage = {
  "object": "page",
  "id": "abc123",
  "created_time": "2023-12-01T17:22:00.000Z",
  "last_edited_time": "2023-12-01T17:22:00.000Z",
  "created_by": {
    "object": "user",
    "id": "abc123"
  },
  "last_edited_by": {
    "object": "user",
    "id": "abc123"
  },
  "cover": null,
  "icon": null,
  "parent": {
    "type": "database_id",
    "database_id": "abc123"
  },
  "archived": false,
  "properties": {
    "Date": {
      "id": "Gcfj",
      "type": "date",
      "date": {
        "start": "2023-11-30",
        "end": null,
        "time_zone": null
      }
    },
    "Select": {
      "id": "%5B%5D%3Ae",
      "type": "select",
      "select": {
        "id": "y_Jq",
        "name": "Option 2",
        "color": "default"
      }
    },
    "Description": {
      "id": "%5CuD~",
      "type": "rich_text",
      "rich_text": [
        {
          "type": "text",
          "text": {
            "content": "this is an e2e generated test page",
            "link": null
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "default"
          },
          "plain_text": "this is an e2e generated test page",
          "href": null
        }
      ]
    },
    "Checkbox": {
      "id": "_r%3Bc",
      "type": "checkbox",
      "checkbox": false
    },
    "Number": {
      "id": "hvE~",
      "type": "number",
      "number": 2
    },
    "Tags": {
      "id": "ypDA",
      "type": "multi_select",
      "multi_select": [
        {
          "id": "abc123",
          "name": "tag 1",
          "color": "pink"
        },
        {
          "id": "abc123",
          "name": " tag 2",
          "color": "brown"
        }
      ]
    },
    "Name": {
      "id": "title",
      "type": "title",
      "title": [
        {
          "type": "text",
          "text": {
            "content": "e2e-test page",
            "link": null
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "default"
          },
          "plain_text": "e2e-test page",
          "href": null
        }
      ]
    },
    "Last edited time": {
      "id": "f%5Dyy",
      "type": "last_edited_time",
      "last_edited_time": "2023-12-01T03:10:00.000Z"
    },
    "Created time": {
      "id": "zOOS",
      "type": "created_time",
      "created_time": "2023-11-30T23:32:00.000Z"
    }
  },
  "url": "https://www.notion.so/abc123",
  "public_url": null,
  "request_id": "abc123"
}
