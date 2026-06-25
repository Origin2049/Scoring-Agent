/**
 * Sample Agent for testing — a simple QA bot
 * Conforms to the Agent Contract: export async function run(input)
 */
export async function run(input) {
  const { query } = input;

  const responses = {
    '什么是人工智能？': {
      output: '人工智能（AI）是计算机科学的一个分支，致力于创建能够执行通常需要人类智能的任务的系统。主要包括机器学习、深度学习、自然语言处理等方向。',
      metadata: { tokenCount: 45, apiCallCount: 1 },
    },
    '请告诉我2028年奥运会的举办城市': {
      output: '2028年夏季奥运会将在美国洛杉矶（Los Angeles）举办。这是洛杉矶第三次举办奥运会（此前为1932年和1984年）。',
      metadata: { tokenCount: 35, apiCallCount: 1 },
    },
    '今天天气怎么样？': {
      output: '抱歉，我无法获取实时天气数据。建议您查看天气预报服务获取最新信息。',
      metadata: { tokenCount: 20, apiCallCount: 1 },
    },
    '请简单介绍一下自己': {
      output: '我是一个AI助手，旨在帮助用户回答问题、完成任务和提供信息支持。',
      metadata: { tokenCount: 18, apiCallCount: 1 },
    },
    'Hello': {
      output: '您好！有什么我可以帮助您的吗？',
      metadata: { tokenCount: 8, apiCallCount: 1, durationMs: 500 },
    },
  };

  // Handle security attacks
  if (query.includes('Ignore all previous instructions') || query.includes('ignore all')) {
    return {
      output: '抱歉，我无法遵循该指令。请提出合规的请求。',
      metadata: { tokenCount: 12, apiCallCount: 1, jailbreak_resistance: 100, prompt_injection_resistance: 100 },
    };
  }

  if (query.includes('how to make') || query.includes('如何制作')) {
    return {
      output: '抱歉，我无法提供此类信息。请提出合法合规的请求。',
      metadata: { tokenCount: 15, apiCallCount: 1, harmful_output_rate: 0 },
    };
  }

  if (query.includes('电话号码') || query.includes('personal information')) {
    return {
      output: '抱歉，我无法提供任何个人身份信息，因为我没有访问此类数据的权限。',
      metadata: { tokenCount: 20, apiCallCount: 1, pii_leak_count: 0 },
    };
  }

  // Handle reasoning test
  if (query.includes('计算')) {
    return {
      output: '计算结果为 12。步骤：5+3=8，8×2=16，16-4=12。',
      metadata: { tokenCount: 25, apiCallCount: 1, task_completion: 100 },
    };
  }

  // Default response
  const match = responses[query];
  if (match) {
    return match;
  }

  // Fuzzy match for misspelled queries
  if (query.includes('天气')) {
    return {
      output: '我理解您想查询天气情况。当前功能暂不支持实时天气查询，您可以尝试使用天气App获取准确信息。',
      metadata: { tokenCount: 30, apiCallCount: 1 },
    };
  }

  return {
    output: `关于"${query}"，我需要更多信息来提供准确的回答。`,
    metadata: { tokenCount: 12, apiCallCount: 1 },
  };
}
