"""
Text Segmenter Module
智能文本分段，将长文本切分为合适的块
"""
import re
from typing import List, Dict
from loguru import logger


class TextSegmenter:
    """文本分段器"""

    def __init__(self, max_chunk_size: int = 500, overlap: int = 50):
        """
        Args:
            max_chunk_size: 最大块大小（字符数）
            overlap: 块之间的重叠字符数
        """
        self.max_chunk_size = max_chunk_size
        self.overlap = overlap
        logger.info(f"TextSegmenter initialized: max_size={max_chunk_size}, overlap={overlap}")

    def segment(self, text: str, document_id: str = "doc") -> List[Dict]:
        """
        将文本分段

        Args:
            text: 输入文本
            document_id: 文档ID

        Returns:
            [
                {
                    "chunk_id": "doc1_chunk0",
                    "text": "分段文本",
                    "start_char": 0,
                    "end_char": 500
                }
            ]
        """
        # 按段落分割
        paragraphs = self._split_by_paragraphs(text)

        chunks = []
        current_chunk = ""
        start_char = 0
        chunk_index = 0

        for para in paragraphs:
            # 如果当前段落很长，需要进一步分割
            if len(para) > self.max_chunk_size:
                # 先保存当前chunk
                if current_chunk:
                    chunks.append({
                        "chunk_id": f"{document_id}_chunk{chunk_index}",
                        "text": current_chunk.strip(),
                        "start_char": start_char,
                        "end_char": start_char + len(current_chunk)
                    })
                    chunk_index += 1
                    start_char += len(current_chunk) - self.overlap
                    current_chunk = ""

                # 分割长段落
                sub_chunks = self._split_long_paragraph(para)
                for sub in sub_chunks:
                    chunks.append({
                        "chunk_id": f"{document_id}_chunk{chunk_index}",
                        "text": sub.strip(),
                        "start_char": start_char,
                        "end_char": start_char + len(sub)
                    })
                    chunk_index += 1
                    start_char += len(sub) - self.overlap

            # 如果添加这个段落会超出大小限制
            elif len(current_chunk) + len(para) > self.max_chunk_size:
                # 保存当前chunk
                chunks.append({
                    "chunk_id": f"{document_id}_chunk{chunk_index}",
                    "text": current_chunk.strip(),
                    "start_char": start_char,
                    "end_char": start_char + len(current_chunk)
                })
                chunk_index += 1

                # 开始新chunk，保留overlap
                overlap_text = current_chunk[-self.overlap:] if len(current_chunk) >= self.overlap else current_chunk
                start_char += len(current_chunk) - len(overlap_text)
                current_chunk = overlap_text + "\n\n" + para

            else:
                # 添加到当前chunk
                if current_chunk:
                    current_chunk += "\n\n" + para
                else:
                    current_chunk = para

        # 保存最后一个chunk
        if current_chunk:
            chunks.append({
                "chunk_id": f"{document_id}_chunk{chunk_index}",
                "text": current_chunk.strip(),
                "start_char": start_char,
                "end_char": start_char + len(current_chunk)
            })

        logger.info(f"Segmented text into {len(chunks)} chunks")
        return chunks

    def _split_by_paragraphs(self, text: str) -> List[str]:
        """按段落分割文本"""
        # 按双换行符分割
        paragraphs = re.split(r'\n\n+', text)
        # 过滤空段落
        return [p.strip() for p in paragraphs if p.strip()]

    def _split_long_paragraph(self, paragraph: str) -> List[str]:
        """分割过长的段落"""
        # 按句子分割
        sentences = re.split(r'([。！？\.\!\?])', paragraph)

        # 重新组合句子和标点
        combined = []
        for i in range(0, len(sentences) - 1, 2):
            if i + 1 < len(sentences):
                combined.append(sentences[i] + sentences[i + 1])
            else:
                combined.append(sentences[i])

        # 组装成合适大小的块
        chunks = []
        current = ""
        for sent in combined:
            if len(current) + len(sent) > self.max_chunk_size:
                if current:
                    chunks.append(current)
                current = sent
            else:
                current += sent

        if current:
            chunks.append(current)

        return chunks if chunks else [paragraph[:self.max_chunk_size]]

    def extract_key_sentences(self, text: str, top_k: int = 3) -> List[str]:
        """
        提取关键句（简单版本，基于位置和长度）

        Args:
            text: 输入文本
            top_k: 返回前K个句子

        Returns:
            关键句列表
        """
        sentences = re.split(r'[。！？\.\!\?]+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 10]

        # 简单策略：选择较长的句子
        scored = [(s, len(s)) for s in sentences]
        scored.sort(key=lambda x: x[1], reverse=True)

        return [s[0] for s in scored[:top_k]]


# 测试代码
if __name__ == "__main__":
    segmenter = TextSegmenter(max_chunk_size=200, overlap=20)

    test_text = """
    机器学习是人工智能的一个重要分支。它使计算机能够在没有明确编程的情况下学习。

    机器学习算法可以从数据中学习模式。这些模式可以用于预测未来的结果。

    深度学习是机器学习的一个子领域。它使用人工神经网络来模拟人脑的学习过程。

    强化学习是另一种重要的机器学习方法。它通过与环境交互来学习最优策略。
    """

    chunks = segmenter.segment(test_text, "test_doc")
    for chunk in chunks:
        print(f"\nChunk {chunk['chunk_id']}:")
        print(f"  Length: {len(chunk['text'])}")
        print(f"  Text: {chunk['text'][:100]}...")
