# 市场数据功能实现总结

> 文档状态：`historical` / `partial implementation`（实现日期 `2026-01-20`）。本文不是当前市场数据能力的完整实现承诺。
>
> 当前真实 provider 尚未完成。`src/lib/services/card-market.ts` 中的 `fetchMarketData` 仍是占位函数，直接返回 `null`；当前可用能力主要是价值估算和外部市场搜索链接。

## 当前已实现

### 服务层

`src/lib/services/card-market.ts` 提供：

- `generateCardSearchQuery()`：根据球星卡属性生成搜索关键词。
- `estimateCardValue()`：基于评级、签名、实物和年份的简单估值，不代表真实市场报价。
- eBay 已售/在售、PSA CardFacts、Beckett 和 130Point 的外部搜索 URL 生成。
- `fetchMarketData(searchQuery)`：占位函数，当前返回 `null`，没有调用 eBay、PSA 或其他真实 API。

### UI

Card 详情页可以显示估值区间、免责声明、搜索关键词和外部链接。外部链接在新标签页打开并使用安全的 `rel` 属性。页面显示的是估算和搜索入口，不应描述为 provider 返回的 recent sales、average price 或实时行情。

## 未完成项（planned）

- 完成真实 provider 的认证、请求、响应解析、限流、错误处理和服务端密钥管理。
- 在 provider 接入后增加缓存、价格历史和非空 `fetchMarketData` 测试。
- 重新审核估值算法、免责声明和外部服务条款。

## 历史测试说明

原实现记录中的“完整市场数据服务”“所有市场数据 API 已测试”和“生产就绪”表述不准确，已由本说明取代。当前应测试搜索 URL、估值逻辑和 `fetchMarketData` 返回 `null` 的占位行为；真实 provider 集成尚未通过验收。

## 参考文件

- `src/lib/services/card-market.ts`
- `src/modules/cards/ui/CardDetail.tsx`
- [MODULE_BLUEPRINT_V3.md](../architecture/MODULE_BLUEPRINT_V3.md)
