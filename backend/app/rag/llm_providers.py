"""
LLM Providers - 支持多个大语言模型提供商
包括: OpenAI, 千问(Qwen), 文心一言, 等
"""
import os
from typing import Dict, List, Optional, Any
from abc import ABC, abstractmethod
from loguru import logger


class LLMProvider(ABC):
    """LLM提供商抽象基类"""

    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model
        self.available = False

    @abstractmethod
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """
        聊天补全接口

        Args:
            messages: 对话消息列表
            temperature: 生成温度
            max_tokens: 最大token数

        Returns:
            {
                "content": "生成的回答",
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            }
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """检查提供商是否可用"""
        pass


class OpenAIProvider(LLMProvider):
    """OpenAI (ChatGPT) 提供商"""

    def __init__(self, api_key: str, model: str = "gpt-3.5-turbo"):
        super().__init__(api_key, model)
        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=api_key)
            self.available = True
            logger.info(f"✓ OpenAI Provider initialized: {model}")
        except Exception as e:
            logger.warning(f"OpenAI initialization failed: {e}")
            self.client = None
            self.available = False

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        if not self.available:
            raise Exception("OpenAI provider not available")

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )

        return {
            "content": response.choices[0].message.content,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
        }

    def is_available(self) -> bool:
        return self.available


class QwenProvider(LLMProvider):
    """千问 (通义千问) 提供商"""

    def __init__(self, api_key: str, model: str = "qwen-turbo"):
        super().__init__(api_key, model)
        try:
            # 千问使用 OpenAI SDK 兼容接口
            from openai import OpenAI
            self.client = OpenAI(
                api_key=api_key,
                base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
            )
            self.available = True
            logger.info(f"✓ Qwen Provider initialized: {model}")
        except Exception as e:
            logger.warning(f"Qwen initialization failed: {e}")
            self.client = None
            self.available = False

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        if not self.available:
            raise Exception("Qwen provider not available")

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )

        return {
            "content": response.choices[0].message.content,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
        }

    def is_available(self) -> bool:
        return self.available


class DeepSeekProvider(LLMProvider):
    """DeepSeek 提供商"""

    def __init__(self, api_key: str, model: str = "deepseek-chat"):
        super().__init__(api_key, model)
        try:
            from openai import OpenAI
            self.client = OpenAI(
                api_key=api_key,
                base_url="https://api.deepseek.com/v1"
            )
            self.available = True
            logger.info(f"✓ DeepSeek Provider initialized: {model}")
        except Exception as e:
            logger.warning(f"DeepSeek initialization failed: {e}")
            self.client = None
            self.available = False

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        if not self.available:
            raise Exception("DeepSeek provider not available")

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )

        return {
            "content": response.choices[0].message.content,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
        }

    def is_available(self) -> bool:
        return self.available


class LLMProviderManager:
    """LLM提供商管理器"""

    # 支持的提供商配置
    PROVIDERS = {
        "openai": {
            "name": "OpenAI (ChatGPT)",
            "class": OpenAIProvider,
            "models": ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"],
            "env_key": "OPENAI_API_KEY"
        },
        "qwen": {
            "name": "千问 (通义千问)",
            "class": QwenProvider,
            "models": ["qwen-turbo", "qwen-plus", "qwen-max"],
            "env_key": "QWEN_API_KEY"
        },
        "deepseek": {
            "name": "DeepSeek",
            "class": DeepSeekProvider,
            "models": ["deepseek-chat", "deepseek-coder"],
            "env_key": "DEEPSEEK_API_KEY"
        }
    }

    def __init__(self):
        self.providers = {}
        self.current_provider = None
        self.current_model = None
        self._init_providers()

    def _init_providers(self):
        """初始化所有配置的提供商"""
        for provider_id, config in self.PROVIDERS.items():
            api_key = os.getenv(config["env_key"])
            if api_key:
                try:
                    default_model = config["models"][0]
                    provider = config["class"](api_key, default_model)
                    if provider.is_available():
                        self.providers[provider_id] = provider
                        logger.info(f"✓ {config['name']} available")

                        # 设置第一个可用的为默认
                        if not self.current_provider:
                            self.current_provider = provider_id
                            self.current_model = default_model
                except Exception as e:
                    logger.warning(f"Failed to initialize {config['name']}: {e}")

        if not self.providers:
            logger.warning("No LLM providers available")
        else:
            logger.info(f"✓ LLM Provider Manager initialized with {len(self.providers)} provider(s)")

    def get_available_providers(self) -> List[Dict[str, Any]]:
        """获取所有可用的提供商"""
        result = []
        for provider_id, provider in self.providers.items():
            config = self.PROVIDERS[provider_id]
            result.append({
                "id": provider_id,
                "name": config["name"],
                "models": config["models"],
                "current": provider_id == self.current_provider,
                "configured": True
            })
        return result

    def get_all_providers(self) -> List[Dict[str, Any]]:
        """获取所有支持的提供商（包括未配置的）"""
        result = []
        for provider_id, config in self.PROVIDERS.items():
            result.append({
                "id": provider_id,
                "name": config["name"],
                "models": config["models"],
                "current": provider_id == self.current_provider,
                "configured": provider_id in self.providers
            })
        return result

    def set_provider(self, provider_id: str, model: str = None) -> bool:
        """设置当前使用的提供商和模型"""
        if provider_id not in self.providers:
            logger.error(f"Provider {provider_id} not available")
            return False

        self.current_provider = provider_id

        if model:
            # 验证模型是否在支持列表中
            if model in self.PROVIDERS[provider_id]["models"]:
                self.current_model = model
                # 更新provider的模型
                self.providers[provider_id].model = model
            else:
                logger.warning(f"Model {model} not in supported list, using default")

        logger.info(f"✓ Switched to {provider_id} - {self.current_model}")
        return True

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1000,
        provider_id: str = None
    ) -> Dict[str, Any]:
        """
        调用聊天补全

        Args:
            messages: 对话消息
            temperature: 生成温度
            max_tokens: 最大token数
            provider_id: 指定提供商(可选，默认使用当前)

        Returns:
            生成结果
        """
        # 使用指定提供商或当前提供商
        pid = provider_id or self.current_provider

        if not pid or pid not in self.providers:
            raise Exception("No LLM provider available")

        provider = self.providers[pid]
        result = provider.chat_completion(messages, temperature, max_tokens)

        # 添加提供商信息
        result["provider"] = pid
        result["model"] = provider.model

        return result

    def is_available(self) -> bool:
        """检查是否有可用的提供商"""
        return len(self.providers) > 0

    def get_current_info(self) -> Dict[str, str]:
        """获取当前提供商信息"""
        if not self.current_provider:
            return {"provider": "none", "model": "none", "name": "未配置"}

        config = self.PROVIDERS[self.current_provider]
        return {
            "provider": self.current_provider,
            "model": self.current_model,
            "name": config["name"]
        }

    def test_provider(self, provider_id: str, api_key: str, model: str = None) -> Dict[str, Any]:
        """
        测试提供商的 API Key 是否有效

        Args:
            provider_id: 提供商ID
            api_key: API密钥
            model: 模型名称（可选）

        Returns:
            测试结果 {"success": bool, "message": str, "model": str}
        """
        if provider_id not in self.PROVIDERS:
            return {
                "success": False,
                "message": f"未知的提供商: {provider_id}"
            }

        config = self.PROVIDERS[provider_id]
        test_model = model or config["models"][0]

        try:
            # 创建临时提供商实例
            provider = config["class"](api_key, test_model)

            if not provider.is_available():
                return {
                    "success": False,
                    "message": "提供商初始化失败"
                }

            # 测试聊天补全
            test_messages = [{"role": "user", "content": "Hello"}]
            result = provider.chat_completion(test_messages, max_tokens=10)

            logger.info(f"✓ API Key test successful for {config['name']}")

            return {
                "success": True,
                "message": f"{config['name']} 连接成功",
                "model": test_model,
                "response": result.get("content", "")[:50]
            }

        except Exception as e:
            logger.error(f"API Key test failed for {provider_id}: {e}")
            return {
                "success": False,
                "message": f"连接失败: {str(e)}"
            }

    def add_or_update_provider(self, provider_id: str, api_key: str, model: str = None) -> bool:
        """
        动态添加或更新提供商

        Args:
            provider_id: 提供商ID
            api_key: API密钥
            model: 模型名称（可选）

        Returns:
            是否成功
        """
        if provider_id not in self.PROVIDERS:
            logger.error(f"Unknown provider: {provider_id}")
            return False

        config = self.PROVIDERS[provider_id]
        use_model = model or config["models"][0]

        try:
            # 创建新的提供商实例
            provider = config["class"](api_key, use_model)

            if not provider.is_available():
                logger.error(f"Provider {provider_id} initialization failed")
                return False

            # 添加或更新提供商
            self.providers[provider_id] = provider

            # 如果这是第一个提供商，设置为当前
            if not self.current_provider:
                self.current_provider = provider_id
                self.current_model = use_model

            logger.info(f"✓ Provider {config['name']} added/updated successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to add provider {provider_id}: {e}")
            return False


# 单例实例
_manager_instance = None


def get_llm_manager() -> LLMProviderManager:
    """获取LLM管理器单例"""
    global _manager_instance
    if _manager_instance is None:
        _manager_instance = LLMProviderManager()
    return _manager_instance
