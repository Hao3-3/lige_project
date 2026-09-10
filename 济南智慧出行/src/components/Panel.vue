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
      width: 90%;
      height: 30px;
      background: url('../assets/chart-item.png');
      background-size: 88% 100%;
      background-repeat:no-repeat;
      background-position: 18%;
      text-align: center;
      margin-bottom: 10px;
      line-height: 30px;
  }
  
  .panel-content{
      position: relative;
      min-height: 100px;
      background: var(--panel-bg);
      border-radius: 10px;
      padding: 20px;
      display: flex;
      justify-content: center;
  }
  
  .panel-content::after{
      content:'';
      position: absolute;
      left: 0;
      top: -6px;
      width: 110px;
      height: 35px;
      background-image: url('../assets/border.png');
      transform: rotate(180deg);
  }
  
  .panel-content::before{
      content:'';
      position: absolute;
      right: 0;
      bottom: -6px;
      width: 110px;
      height: 35px;
      background-image: url('../assets/border.png');
  }
  

  </style>