import { insertStyles } from "./internal/styles";
import css from "./styles.css?inline";

insertStyles(css);

export { useRim } from "./internal/refraction";
export { TabBar, type TabBarItem, type TabBarProps } from "./tab-bar";
