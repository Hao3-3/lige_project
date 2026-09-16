<template>
  <div class="panel">
    <div class="panel-header">
        <slot name="header"></slot>
    </div>
    <div class="panel-content">
        <slot></slot>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.panel{
    max-width: 600px;
    max-height: 600px;
    min-width: 200px;
    min-height: 200px;
    color: #fff;
    margin-top: -15px;
}
.panel-header{
    width: 92%;
    height: 32px;
    background: linear-gradient(90deg, transparent, rgba(0,200,255,.22) 20%, rgba(0,200,255,.22) 80%, transparent);
    border-bottom: 1px solid rgba(0,212,255,.4);
    text-align: center;
    margin-bottom: 10px;
    line-height: 32px;
    font-size: 14px;
    font-weight: 700;
    color: #5fe0ff;
    letter-spacing: 1px;
    text-shadow: 0 0 8px rgba(0,212,255,.5);
}
.panel-content{
    position: relative;
    min-height: 100px;
    background: linear-gradient(160deg, rgba(10,30,55,.25), rgba(8,20,40,.3));
    border: 1px solid rgba(0,212,255,.25);
    border-radius: 10px;
    padding: 16px;
    display: flex;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(0,0,0,.35), inset 0 1px 0 rgba(100,200,255,.15);
    backdrop-filter: blur(8px);
}
</style>
