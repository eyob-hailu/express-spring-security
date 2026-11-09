import DefaultTheme from 'vitepress/theme';
import RequestLifecycleDiagram from './components/RequestLifecycleDiagram.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: any }) {
    app.component('RequestLifecycleDiagram', RequestLifecycleDiagram);
  }
};
