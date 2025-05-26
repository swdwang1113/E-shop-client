<template>
  <div class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-info">
          <h3>电商商城</h3>
          <p>提供优质商品和服务的在线购物平台</p>
        </div>
        
        <div class="footer-links">
          <div class="link-group">
            <h4>关于我们</h4>
            <a href="javascript:;">公司简介</a>
            <a href="javascript:;">联系我们</a>
            <a href="javascript:;">加入我们</a>
          </div>
          
          <div class="link-group">
            <h4>帮助中心</h4>
            <a href="javascript:;">购物指南</a>
            <a href="javascript:;">支付方式</a>
            <a href="javascript:;">配送方式</a>
          </div>
          
          <div class="link-group">
            <h4>商家服务</h4>
            <a href="javascript:;">商家入驻</a>
            <a href="javascript:;">商家中心</a>
            <a href="javascript:;">运营服务</a>
          </div>
        </div>
      </div>
      
      <div class="copyright">
        <p>© 2023 电商商城 版权所有</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Footer组件
</script>

<style scoped>
.footer {
  background-color: #ffffff;
  padding: 40px 0 20px;
  margin-top: 40px;
  border-top: 1px solid #e0e0e0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 30px;
}

.footer-info {
  width: 300px;
}

.footer-info h3 {
  margin-bottom: 15px;
  color: #333;
}

.footer-info p {
  color: #666;
  line-height: 1.6;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
}

.link-group {
  width: 150px;
  margin-left: 30px;
}

.link-group h4 {
  margin-bottom: 15px;
  color: #333;
}

.link-group a {
  display: block;
  margin-bottom: 10px;
  color: #666;
  text-decoration: none;
  transition: color 0.3s;
}

.link-group a:hover {
  color: #409EFF;
}

.copyright {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
  color: #999;
}

@media (max-width: 768px) {
  .footer-info {
    width: 100%;
    margin-bottom: 30px;
  }
  
  .link-group {
    width: calc(50% - 30px);
    margin-bottom: 20px;
  }
}
</style> 