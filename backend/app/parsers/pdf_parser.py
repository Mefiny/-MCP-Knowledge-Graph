"""
PDF Parser Module
解析PDF文件，提取文本和元数据
"""
import os
from typing import Dict, List, Optional
from pathlib import Path
import fitz  # PyMuPDF
from loguru import logger


class PDFParser:
    """PDF文件解析器"""

    def __init__(self):
        logger.info("PDFParser initialized")

    def parse(self, file_path: str) -> Dict:
        """
        解析PDF文件

        Args:
            file_path: PDF文件路径

        Returns:
            {
                "text": "完整文本",
                "pages": [{"page_num": 1, "text": "页面内容"}],
                "metadata": {"title": "", "author": "", ...}
            }
        """
        try:
            # 打开PDF文件
            doc = fitz.open(file_path)

            # 提取元数据
            metadata = {
                "title": doc.metadata.get("title", ""),
                "author": doc.metadata.get("author", ""),
                "subject": doc.metadata.get("subject", ""),
                "creator": doc.metadata.get("creator", ""),
                "page_count": doc.page_count,
                "file_name": Path(file_path).name
            }

            # 提取所有页面文本
            pages = []
            full_text = []

            for page_num in range(doc.page_count):
                page = doc[page_num]
                text = page.get_text("text")

                pages.append({
                    "page_num": page_num + 1,
                    "text": text.strip()
                })

                full_text.append(text)

            doc.close()

            result = {
                "text": "\n\n".join(full_text),
                "pages": pages,
                "metadata": metadata,
                "status": "success"
            }

            logger.info(f"Successfully parsed PDF: {file_path}, {metadata['page_count']} pages")
            return result

        except Exception as e:
            logger.error(f"Error parsing PDF {file_path}: {str(e)}")
            return {
                "text": "",
                "pages": [],
                "metadata": {},
                "status": "error",
                "error": str(e)
            }

    def extract_text_by_page(self, file_path: str, page_num: int) -> str:
        """提取指定页面的文本"""
        try:
            doc = fitz.open(file_path)
            if page_num < 1 or page_num > doc.page_count:
                raise ValueError(f"Page number {page_num} out of range")

            page = doc[page_num - 1]
            text = page.get_text("text")
            doc.close()

            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting page {page_num}: {str(e)}")
            return ""

    def get_page_count(self, file_path: str) -> int:
        """获取PDF页数"""
        try:
            doc = fitz.open(file_path)
            count = doc.page_count
            doc.close()
            return count
        except Exception as e:
            logger.error(f"Error getting page count: {str(e)}")
            return 0


# 测试代码
if __name__ == "__main__":
    parser = PDFParser()

    # 测试文件
    test_file = "test.pdf"
    if os.path.exists(test_file):
        result = parser.parse(test_file)
        print(f"Title: {result['metadata']['title']}")
        print(f"Pages: {result['metadata']['page_count']}")
        print(f"First 200 chars: {result['text'][:200]}...")
    else:
        print(f"Test file {test_file} not found")
