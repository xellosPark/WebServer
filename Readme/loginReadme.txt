//login진행 순서(jwt방식)

**설치 목록
npm i jsonwebtoken cookie-parser
Server 설치되어야 사용 가능

1. Client에서 Server로 정보 전달 (id, pw)
2. Server의 Database에서 해당 정보 찾기
 - 해당 정보 없으면 status 403으로 error 보냄
 - 해당 정보 있으면 response로 accesstoken과 refreshtoken 생성함(client가 가지고 있어야할 정보를 token이 가지고 있음)
 - client에서 형식을 잘못 보냈으면 status 500으로 error 보냄
3. accesstoken과 refreshtoken이 유지될 시간을 정하고 token과 함께 status 200(성공)으로 보냄
(보통 accesstoken을 1시간, refreshtoken을 24시간으로 둠)


//로그인 구현할때 생각하면 좋은 것(GPT 사용)
웹에서 로그인을 구현할 때, 사용자 식별 정보로 email 형식의 아이디를 사용하는 것이 매우 일반적입니다.
여러 이유에서 email을 사용하는 것이 id를 사용하는 것보다 더 선호되는 경우가 많습니다:

1. 유일성(Uniqueness): 이메일 주소는 전 세계적으로 고유합니다. 사용자가 자신의 이메일 주소를 로그인 아이디로 사용하면, 해당 서비스 내에서 유일한 식별자 역할을 할 수 있습니다.
반면에 단순 id를 사용할 경우, 유일성을 보장하기 위해 추가적인 로직을 구현해야 할 수 있습니다.

2. 보안(Security): 이메일을 사용하면 사용자가 이메일 계정에 대한 접근 권한을 유지하고 있는 한 계정 복구와 보안 관련 통지를 보다 쉽게 처리할 수 있습니다.
예를 들어, 비밀번호를 잊어버렸을 경우 이메일을 통한 비밀번호 재설정 링크 발송이 흔한 방법입니다.

3. 편의성(Convenience): 대부분의 사용자는 자신의 이메일 주소를 기억하기 쉽다고 느낍니다.
새로운 id를 만들고 기억하는 것보다 기존에 사용하고 있는 이메일 주소를 사용하는 것이 더 편리할 수 있습니다.

4. 통신(Communication): 이메일 주소를 사용하면 서비스 제공자가 사용자와 소통하는 데 있어 중요한 수단을 갖게 됩니다.
예를 들어, 뉴스레터 발송, 보안 알림, 서비스 업데이트 등을 이메일을 통해 손쉽게 전달할 수 있습니다.

5. 그럼에도 불구하고, 어떤 식별 정보를 사용할지는 서비스의 특성과 사용자의 요구에 따라 달라질 수 있습니다.
일부 서비스는 사용자에게 닉네임이나 사용자명(username)을 선택할 수 있는 옵션을 제공하며, 이는 주로 커뮤니티 기반 서비스나 게임 등에서 보다 흔합니다.
이 경우에도 보안과 복구 목적으로 이메일 주소는 여전히 중요한 역할을 합니다.

결론적으로, 현대 웹 서비스에서는 이메일 주소를 사용자 로그인 및 식별의 기본 수단으로 사용하는 것이 매우 일반적입니다.
