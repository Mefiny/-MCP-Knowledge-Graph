"""
Named Entity Recognition (NER) Module
实体识别和关系抽取
"""
import re
from typing import List, Dict, Set
from loguru import logger

# 注意：完整版需要 import spacy，这里先提供简化版本


class SimpleNER:
    """
    简化版NER（基于规则）
    完整版本需要安装spaCy模型后使用
    """

    def __init__(self):
        # 技术术语词典（扩展版）
        self.tech_keywords = {
            # AI/ML
            "机器学习", "深度学习", "神经网络", "强化学习", "监督学习", "无监督学习",
            "卷积神经网络", "循环神经网络", "CNN", "RNN", "LSTM", "GRU",
            "自然语言处理", "计算机视觉", "NLP", "CV", "AI", "人工智能",
            "transformer", "Transformer", "BERT", "GPT", "attention", "Attention",
            "数据挖掘", "知识图谱", "推荐系统", "生成对抗网络", "GAN",
            # 技术框架
            "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "scikit-learn",
            "Docker", "Kubernetes", "K8s", "微服务", "云计算", "大数据",
            "Hadoop", "Spark", "Flink", "Kafka", "Redis", "MongoDB", "MySQL",
            # 编程语言
            "Python", "Java", "JavaScript", "C++", "Go", "Rust", "TypeScript",
            # 通用技术
            "API", "SDK", "框架", "算法", "模型", "数据集", "训练", "推理",
            "服务器", "数据库", "缓存", "消息队列", "负载均衡", "分布式",
            "前端", "后端", "全栈", "DevOps", "CI/CD", "容器", "虚拟化",
            # 业务相关
            "系统", "平台", "应用", "服务", "功能", "模块", "组件", "架构",
            "检测", "识别", "分析", "处理", "优化", "管理", "监控", "部署"
        }

        # 组织机构关键词
        self.org_keywords = {
            "大学", "学院", "研究所", "实验室", "公司", "集团", "中心", "部门",
            "团队", "组织", "机构", "协会", "联盟", "基金会", "研究院"
        }

        # 人名模式（常见姓氏）
        self.person_surnames = {
            "王", "李", "张", "刘", "陈", "杨", "赵", "黄", "周", "吴",
            "徐", "孙", "胡", "朱", "高", "林", "何", "郭", "马", "罗"
        }

        logger.info("Enhanced SimpleNER initialized with expanded keywords")

    def extract_entities(self, text: str) -> List[Dict]:
        """
        提取实体

        Args:
            text: 输入文本

        Returns:
            [
                {
                    "text": "机器学习",
                    "label": "TECH",
                    "start": 0,
                    "end": 4
                }
            ]
        """
        entities = []

        # 1. 提取技术术语
        for keyword in self.tech_keywords:
            for match in re.finditer(re.escape(keyword), text):
                entities.append({
                    "text": keyword,
                    "label": "TECH",
                    "start": match.start(),
                    "end": match.end(),
                    "confidence": 0.9
                })

        # 2. 提取组织机构（简单模式匹配）
        for keyword in self.org_keywords:
            pattern = f"[\\u4e00-\\u9fa5]{{2,10}}{keyword}"
            for match in re.finditer(pattern, text):
                entities.append({
                    "text": match.group(),
                    "label": "ORG",
                    "start": match.start(),
                    "end": match.end(),
                    "confidence": 0.7
                })

        # 3. 提取日期
        date_patterns = [
            r'\d{4}年\d{1,2}月\d{1,2}日',
            r'\d{4}年\d{1,2}月',
            r'\d{4}年',
            r'\d{4}-\d{1,2}-\d{1,2}',
            r'\d{4}/\d{1,2}/\d{1,2}'
        ]
        for pattern in date_patterns:
            for match in re.finditer(pattern, text):
                entities.append({
                    "text": match.group(),
                    "label": "DATE",
                    "start": match.start(),
                    "end": match.end(),
                    "confidence": 0.95
                })

        # 4. 提取人名（基于姓氏+2-3个字符）
        for surname in self.person_surnames:
            pattern = f"{surname}[\\u4e00-\\u9fa5]{{1,3}}(?=[，。、；：！？\\s]|$)"
            for match in re.finditer(pattern, text):
                name = match.group()
                # 排除一些常见的非人名组合
                if name not in self.tech_keywords and name not in self.org_keywords:
                    entities.append({
                        "text": name,
                        "label": "PERSON",
                        "start": match.start(),
                        "end": match.end(),
                        "confidence": 0.7
                    })

        # 5. 提取数值和度量
        number_patterns = [
            r'\d+\.\d+%',  # 百分比
            r'\d+%',
            r'\d+\.\d+[公千米吨斤克]',  # 度量单位
            r'\d+[万亿千百十][元人次个]',  # 数量
        ]
        for pattern in number_patterns:
            for match in re.finditer(pattern, text):
                entities.append({
                    "text": match.group(),
                    "label": "NUMBER",
                    "start": match.start(),
                    "end": match.end(),
                    "confidence": 0.9
                })

        # 去重
        entities = self._deduplicate_entities(entities)

        logger.info(f"Extracted {len(entities)} entities with enhanced rules")
        return entities

    def _deduplicate_entities(self, entities: List[Dict]) -> List[Dict]:
        """去除重叠的实体，保留置信度高的"""
        if not entities:
            return []

        # 按起始位置排序
        entities.sort(key=lambda x: (x['start'], -x['confidence']))

        result = []
        last_end = -1

        for ent in entities:
            # 如果不重叠，添加
            if ent['start'] >= last_end:
                result.append(ent)
                last_end = ent['end']

        return result


class SpacyNER:
    """
    基于spaCy的NER（需要安装模型）
    使用方法：python -m spacy download zh_core_web_sm
    """

    def __init__(self, model_name: str = "zh_core_web_sm"):
        try:
            import spacy
            self.nlp = spacy.load(model_name)
            self.available = True
            logger.info(f"SpacyNER initialized with model: {model_name}")
        except Exception as e:
            logger.warning(f"SpaCy model not available: {e}")
            self.available = False
            self.nlp = None

    def extract_entities(self, text: str) -> List[Dict]:
        """使用spaCy提取实体"""
        if not self.available:
            logger.warning("SpaCy not available, using SimpleNER instead")
            simple_ner = SimpleNER()
            return simple_ner.extract_entities(text)

        doc = self.nlp(text)
        entities = []

        for ent in doc.ents:
            entities.append({
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char,
                "confidence": 1.0
            })

        logger.info(f"SpaCy extracted {len(entities)} entities")
        return entities


class RelationExtractor:
    """关系抽取器（增强版）"""

    def __init__(self):
        # 关系模式定义（谓词 -> 正则模式列表）
        self.relation_patterns = {
            "属于": [
                r"{e1}.*?属于.*?{e2}",
                r"{e1}.*?是.*?{e2}.*?(的一部分|的组成)",
            ],
            "包含": [
                r"{e1}.*?包含.*?{e2}",
                r"{e1}.*?包括.*?{e2}",
                r"{e1}.*?含有.*?{e2}",
            ],
            "用于": [
                r"{e1}.*?用于.*?{e2}",
                r"{e1}.*?应用于.*?{e2}",
                r"{e1}.*?服务于.*?{e2}",
            ],
            "实现": [
                r"{e1}.*?实现.*?{e2}",
                r"{e1}.*?完成.*?{e2}",
                r"{e1}.*?达成.*?{e2}",
            ],
            "支持": [
                r"{e1}.*?支持.*?{e2}",
                r"{e1}.*?兼容.*?{e2}",
                r"{e1}.*?适配.*?{e2}",
            ],
            "依赖": [
                r"{e1}.*?依赖.*?{e2}",
                r"{e1}.*?需要.*?{e2}",
                r"{e1}.*?基于.*?{e2}",
            ],
            "产生": [
                r"{e1}.*?产生.*?{e2}",
                r"{e1}.*?生成.*?{e2}",
                r"{e1}.*?输出.*?{e2}",
            ],
            "处理": [
                r"{e1}.*?处理.*?{e2}",
                r"{e1}.*?分析.*?{e2}",
                r"{e1}.*?检测.*?{e2}",
            ],
        }
        logger.info("Enhanced RelationExtractor initialized with pattern matching")

    def extract_relations(self, text: str, entities: List[Dict]) -> List[Dict]:
        """
        提取实体间关系（增强版）

        策略：
        1. 模式匹配：识别有意义的关系模式
        2. 智能共现：仅为相邻或紧密相关的实体创建关系
        """
        relations = []
        seen_relations = set()  # 去重

        # 1. 基于模式的关系抽取
        for predicate, patterns in self.relation_patterns.items():
            for ent1 in entities:
                for ent2 in entities:
                    if ent1['text'] == ent2['text']:
                        continue

                    for pattern_template in patterns:
                        # 替换模板中的实体占位符
                        pattern = pattern_template.format(
                            e1=re.escape(ent1['text']),
                            e2=re.escape(ent2['text'])
                        )

                        match = re.search(pattern, text)
                        if match:
                            relation_key = (ent1['text'], predicate, ent2['text'])
                            if relation_key not in seen_relations:
                                relations.append({
                                    "subject": ent1['text'],
                                    "predicate": predicate,
                                    "object": ent2['text'],
                                    "confidence": 0.85,
                                    "evidence": match.group()[:100]
                                })
                                seen_relations.add(relation_key)

        # 2. 智能共现关系（同一句子或段落中的实体）
        # 使用多个分隔符：句子和逗号
        segments = []

        # 先按句子分割
        sentences = re.split(r'[。！？\.\!\?]+', text)
        for sent in sentences:
            if len(sent.strip()) < 5:
                continue
            # 再按逗号等分割成更小的片段
            sub_segments = re.split(r'[，、；]', sent)
            segments.extend(sub_segments)

        # 为每个片段中的实体创建关系
        for segment in segments:
            if len(segment.strip()) < 3:
                continue

            # 找出这个片段中的所有实体
            seg_entities = []
            for ent in entities:
                if ent['text'] in segment:
                    # 避免重复添加
                    if ent not in seg_entities:
                        seg_entities.append(ent)

            # 为片段中的实体创建共现关系
            for i in range(len(seg_entities)):
                # 每个实体最多与后面5个实体创建关系
                for j in range(i + 1, min(i + 6, len(seg_entities))):
                    # 检查两个实体是否在片段中距离适中（<120字符）
                    pos1 = segment.find(seg_entities[i]['text'])
                    pos2 = segment.find(seg_entities[j]['text'])

                    if pos1 != -1 and pos2 != -1 and abs(pos2 - pos1) < 120:
                        relation_key = (seg_entities[i]['text'], "相关", seg_entities[j]['text'])
                        # 避免重复关系
                        reverse_key = (seg_entities[j]['text'], "相关", seg_entities[i]['text'])

                        if relation_key not in seen_relations and reverse_key not in seen_relations:
                            relations.append({
                                "subject": seg_entities[i]['text'],
                                "predicate": "相关",
                                "object": seg_entities[j]['text'],
                                "confidence": 0.65,
                                "evidence": segment[:100]
                            })
                            seen_relations.add(relation_key)

        logger.info(f"Extracted {len(relations)} high-quality relations")
        return relations


# 测试代码
if __name__ == "__main__":
    # 测试简单NER
    simple_ner = SimpleNER()
    test_text = """
    机器学习是人工智能的重要分支。清华大学计算机系在2023年发表了关于深度学习的研究。
    卷积神经网络（CNN）在计算机视觉领域表现出色。
    """

    entities = simple_ner.extract_entities(test_text)
    print(f"\n提取到 {len(entities)} 个实体:")
    for ent in entities:
        print(f"  {ent['text']} ({ent['label']}) - confidence: {ent['confidence']}")

    # 测试关系抽取
    relation_extractor = RelationExtractor()
    relations = relation_extractor.extract_relations(test_text, entities)
    print(f"\n提取到 {len(relations)} 个关系:")
    for rel in relations[:5]:  # 只显示前5个
        print(f"  {rel['subject']} --[{rel['predicate']}]-> {rel['object']}")
