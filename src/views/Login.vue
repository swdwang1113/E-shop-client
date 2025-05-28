<template>
  <div class="login-container">
    <div class="login-form">
      <h2 class="title">用户登录</h2>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        status-icon
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            @keyup.enter="submitForm"
          />
        </el-form-item>
        
        <el-form-item label="验证码" prop="captcha">
          <div class="captcha-container">
            <el-input 
              v-model="form.captcha" 
              placeholder="请输入验证码" 
              @keyup.enter="submitForm"
              maxlength="6"
            />
            <div class="captcha-img" @click="refreshCaptcha" title="点击刷新验证码">
              <img v-if="captchaUrl" :src="captchaUrl" alt="验证码" />
              <div v-else class="captcha-loading">加载中...</div>
            </div>
          </div>
          <div class="captcha-actions">
            <el-button type="text" @click="refreshCaptcha" size="small">看不清？点击刷新</el-button>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            class="submit-btn"
            :loading="loading"
            @click="submitForm"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="form-footer">
        <span>还没有账号？</span>
        <a href="javascript:void(0)" @click="navigateTo('/register')">立即注册</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../store/user'
import { getCaptcha } from '../api/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)
const captchaUrl = ref('')

const form = reactive({
  username: '',
  password: '',
  captcha: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3到20个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应在6到20个字符之间', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, max: 6, message: '请输入正确的验证码', trigger: 'blur' }
  ]
}

// 获取验证码
const refreshCaptcha = async () => {
  try {
    // 先清除旧的URL，避免内存泄漏
    if (captchaUrl.value) {
      URL.revokeObjectURL(captchaUrl.value);
    }
    
    const response = await getCaptcha();
    
    // 检查响应是否为Blob类型
    if (response instanceof Blob) {
      // 将二进制数据转换为URL
      captchaUrl.value = URL.createObjectURL(response);
    } else {
      ElMessage.error('获取验证码失败，请刷新页面重试');
    }
  } catch (error) {
    console.error('获取验证码失败:', error);
    ElMessage.error('获取验证码失败，请刷新页面重试');
  }
}

// 通用导航函数
const navigateTo = (path, query = {}) => {
  console.log(`导航到: ${path}`, query)
  
  router.push({ path, query }).catch(err => {
    if (err.name !== 'NavigationDuplicated') {
      console.error('导航错误:', err)
      // 使用window.location作为备用
      const queryString = Object.keys(query).length > 0 
        ? '?' + new URLSearchParams(query).toString() 
        : ''
      window.location.href = path + queryString
    }
  })
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        const res = await userStore.login(form)
        
        // 登录成功后获取用户信息
        await userStore.getUserInfo()
        
        ElMessage({
          type: 'success',
          message: '登录成功'
        })
        
        // 根据用户角色跳转到不同页面
        if (userStore.isAdmin) {
          // 如果是管理员，跳转到后台页面
          console.log('管理员登录，跳转到后台页面')
          router.push('/admin')
        } else {
          // 普通用户跳转到首页
          console.log('普通用户登录，跳转到首页')
          router.push('/')
        }
      } catch (error) {
        console.error('登录失败:', error)
        // 登录失败时刷新验证码
        refreshCaptcha()
      } finally {
        loading.value = false
      }
    }
  })
}

// 组件挂载时获取验证码
onMounted(() => {
  refreshCaptcha()
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 60px);
  background-color: #f5f5f5;
}

.login-form {
  width: 400px;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.submit-btn {
  width: 100%;
}

.form-footer {
  margin-top: 20px;
  text-align: center;
  color: #666;
}

.form-footer a {
  color: #409EFF;
  text-decoration: none;
  margin-left: 5px;
}

.captcha-container {
  display: flex;
  align-items: center;
  gap: 15px;  /* 增加间距 */
}

/* 调整验证码输入框宽度 */
.captcha-container .el-input {
  width: 45%;  /* 稍微缩小一点 */
}

.captcha-img {
  width: 150px;  /* 验证码图片宽度 */
  height: 50px;  /* 验证码图片高度 */
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s;  /* 添加过渡效果 */
}

.captcha-img:hover {
  border-color: #409EFF;  /* 鼠标悬停时边框颜色变化 */
  box-shadow: 0 0 5px rgba(64, 158, 255, 0.5);  /* 添加阴影效果 */
}

.captcha-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captcha-loading {
  color: #909399;
  font-size: 14px;
}

.captcha-actions {
  margin-top: 5px;
  text-align: right;
  font-size: 12px;
  color: #909399;
}
</style> 