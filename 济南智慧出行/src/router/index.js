import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  { path: "/", component: () => import("../views/home.vue") },
  { path: "/login", component: () => import("../views/Login.vue") },
  /*     {
        path: "/mapcontrol",
        component: () => import("../components/mapcontrol.vue"),
    }, */
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 登录守卫：未登录跳转到 /login
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  if (to.path !== "/login" && !token) {
    next("/login");
  } else if (to.path === "/login" && token) {
    next("/");
  } else {
    next();
  }
});

export default router;
