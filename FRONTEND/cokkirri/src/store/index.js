import { createStore } from 'vuex';
import axios from "../api/index.js";
// vuex의 mutations 및 action 에서 주소관리를 하기 위해서 가져옴

import router from '../routes/index.js';
// 모듈 불러오기


// vuex 를 사용하여 로그인 상태와 로그인 id 를 저장
export default createStore({
    // 컴포넌트에서 해당 state의 값을 불러오고자 한다면, this.$store.state.~ 형식으로 불러올 수 있다.
    // 예시 : this.$store.state.id
    state: {
        id: null,
        isLogin: false,

        major: null,
        name: null,
        number: null,
        sex: null,
        studentNum: null,
        course: [],
        password: null,
        heart: null,
        restrctionDate: null,

        usageHistory: [],

        notification: null,

        publicMatchingRecord: null,
        classMatchingRecord: null,

        // 매칭 대기 정보 불러오기
        classMatchingWait: null,
        publicMatchingWait: null,

        // 선택된 매칭 번호
        matchingIdForChatroom: null,
        matchingTypeForChatroom: null
    },
    mutations: {
        // 매칭 대기 저장
        SaveClassWait(state,record){
            if(Object.keys(record).length > 0){
                state.classMatchingWait = record
                console.log("수업")
                console.log(state.classMatchingWait)
            }
            else{
                console.log("수업 대기 없다고 판단")
            }
        },
        SavePublicWait(state,record){
            if(Object.keys(record).length > 0){
                state.publicMatchingWait = record
                console.log("공강")
                console.log(state.publicMatchingWait)
            }
            else{
                console.log("공강 대기 없다고 판단")
            }
        },

        // 사용자 매칭 정보 불러오기
        publicSave(state, record){
            state.publicMatchingRecord = record
        },
        classSave(state, record){
            state.classMatchingRecord = record
        },

        //하트 사용내역 불러오기
        setUsageHistory(state, history) {
            state.usageHistory = history;
        },
        // 로그인 적용 후 ~ 페이지로 이동. 추후 메인 페이지로 이동 변경 예정.
        loginSuccess(state, payload) {
            state.isLogin = true
            state.id = payload
            router.replace('/Starting')
        },
        userInfoApply(state, payload){
            state.major = payload.major
            state.name = payload.name
            state.number = payload.number
            state.sex = payload.sex
            state.studentNum = payload.studentNum
            state.course = payload.course
            state.password = payload.password
            state.heart = payload.heart
            state.restrctionDate = payload.restrctionDate
        },
        dateReform(state){
            if(state.restrctionDate===null){
                console.log("규제 기간 없다고 판단->매칭 신고")
                return
            }
            else{
                console.log(state.restrctionDate)
                const dateTemp = new Date(state.restrctionDate)
                alert("현재 사용자는 과거 노쇼를 한 기록으로 인해 " + dateTemp.getFullYear() + "년 " + dateTemp.getMonth() + "월 " + dateTemp.getDay() + "일 " + dateTemp.getHours() + "시 " + dateTemp.getMinutes() + "분까지 매칭이 금지된 상태입니다.")
            }
        },
        logout(state) { 
            state.isLogin = false
            state.id = null
        },
        SET_NOTIFICATION(state, notification){
            console.log("들어온 신호"+notification)
            state.notification = notification
            console.log("저장한 신호"+state.notification)
        },

        updateUsageHistory(state, newHistory) {
            state.usageHistory.push(newHistory);
        }
    },
    actions: {
        // 매칭 정보 불러오기
        async callMatchingRecord({commit, dispatch, state}) {
            try{
                await axios.get('/userMypage/publicMatchedList',{
                    params:{
                        userId: state.id
                }}).then((result)=>{
                    commit('publicSave',result.data)
                }).catch(function(error){
                    console.log(error)
                })
            } catch(error){
                console.log(error)
            }
            try{
                await axios.get('/userMypage/classMatchedList',{
                    params:{
                        userId: state.id
                }}).then((result)=>{
                    commit('classSave',result.data)
                }).catch(function(error){
                    console.log(error)
                })
            } catch(error){
                console.log(error)
            }
            dispatch('callMatchingWaitRecord')
        },

        // 각 컴포넌트에서 this.$store.dispatch('메소드 이름', { 데이터 변수: 입력값 }) 형식으로 사용 가능
        // 로그인 요청 및 store 정보 업데이트
        async loginRequest({commit, dispatch}, {inputId, inputPassword}){
            // 로그인 api 요청 부분. 반환값에 토큰 없음.
            try{
                await axios.post('/login', null, {
                    params: {
                        id: inputId,
                        password: inputPassword,
                    }
                })
                .then((result) => {
                    if(result.status === 200){
                        if(result.data === true){
                            commit('loginSuccess', inputId);
                            dispatch('userInfoUpdate')
                            dispatch('callMatchingRecord')
                            dispatch('subscribeToSse')
                            alert('로그인 되었습니다.')
                        }
                        else{
                            alert('아이디 및 비밀번호에 대응되는 회원 정보가 없습니다.')
                        }
                    }
                }).catch(function(error){
                    console.log(error);
                });
            } catch(error){
                console.log(error);
            }
        },
        // vuex의 state.id 기반으로 현재 유저의 정보를 업데이트한다.
        async userInfoUpdate({state,commit}){
            try{
                await axios.get('/admin/user/id',{
                        params: {
                            userId: state.id
                        }
                    })
                    .then((result) =>{
                        if(result.status === 200){
                            commit('userInfoApply', result.data)
                            console.log(result.data)
                            console.log("유저 정보 업데이트 완료")
                        }
                        else{
                            console.log("로그인 실패")
                        }
                    })
                    .catch(function(error){
                        console.log(error)
                    })
            } catch(error){
                console.log(error);
            }
        },
        //마이페이지에서 유저 정보 수정
        async userInfoEdit({dispatch}, {inputId, inputMajor, inputNumber, inputCourse, inputPassword}){
            try{
                await axios.put('/userMypage/'+inputId, null, {
                    params: {
                        password: inputPassword,
                        major: inputMajor,
                        number: inputNumber,
                        course: inputCourse.map(encodeURIComponent).join(',')
                    }
                })
                .then(()=>{
                    dispatch('userInfoUpdate')
                    alert("수정 완료")
                })
                .catch(function(error){
                    console.log(error)
                })
            } catch(error){
                console.log(error)
            }
        },

        subscribeToSse({ state }) {
            let eventSource = new EventSource('http://3.37.37.164:8080/subscribe/' + state.id);
        
            eventSource.addEventListener("sse",(event)=>{
                console.log(event.data)
                //commit('SET_NOTIFICATION', event);
            });
            
            eventSource.onerror = error => {
                console.error('SSE connection error', error);
                if (eventSource.readyState === EventSource.CLOSED) {
                    eventSource = new EventSource('http://3.37.37.164:8080/subscribe/' + state.id);
                }
                else{
                    console.log("sse 연결된 상태입니다. 하지만 sse 응답 에러가 발생했습니다.")
                }
            }; 
            
        },

        async fetchUsageHistory({ commit }) {
            try {
              const response = await axios.get('/admin/user/payment'); // 적절한 API 엔드포인트로 변경
              const history = response.data; // 가져온 데이터를 적절히 가공하여 history 변수에 저장
                commit('setUsageHistory', history);
            } catch (error) {
                console.log(error);
            }
        },
        async callMatchingWaitRecord({state, commit}){
            try{
                await axios.get('/matching/get/class/matchingWait',{
                    params:{
                        email: state.id
                    }
                })
                .then((result)=>{
                    commit('SaveClassWait',result.data)
                })
                .catch(function(error){
                    console.log(error)
                })
            }catch(error){
                console.log(error)
            }
            try{
                await axios.get('/matching/get/free/matchingWait',{
                    params:{
                        email: state.id
                    }
                })
                .then((result)=>{
                    commit('SavePublicWait',result.data)
                })
                .catch(function(error){
                    console.log(error)
                })
            }catch(error){
                console.log(error)
            }

        }

    },
})
