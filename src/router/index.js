import { createRouter, createWebHashHistory } from "vue-router";
const routes =[
    {path:'/',component:()=>import ('../views/home.vue')},
/*     {
        path: "/mapcontrol",
        component: () => import("../components/mapcontrol.vue"),
    }, */
];
const router = createRouter({
    history: createWebHashHistory(),
    routes,
});
export default router;