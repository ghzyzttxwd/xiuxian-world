# src/data

这里存放纯静态游戏数据，不放 DOM 操作、存档读写、随机数调用或业务副作用。

迁移顺序：REALMS -> ROOTS -> LOCATIONS -> enemies/items/manuals/spells。

迁移要求：键名、数组顺序、数值、文本必须与 V3.9 原始数据完全一致。
