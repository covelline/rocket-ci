require 'pathname'

#
# Google Cloud Storage に保存されたキャッシュを管理するクラス
#
class RemoteCache
  #
  # bucket にキャッシュがあるかどうかを確認します. gcs へのアクセスが発生するので注意
  #
  def self.exist?(bucket, repository_id)
    bucket.file(cache_path(repository_id)) != nil
  end

  #
  # gcs からキャッシュを復元します。復元されたキャッシュは / へパスの構造を保ったまま展開されます
  #
  def self.restore(bucket, repository_id)
    bucket.file(cache_path(repository_id)).download('/tmp/restore.tar')
    `tar xvf /tmp/restore.tar -C /`
  end

  #
  # gcs にキャッシュを保存します。パスには / から始まる絶対パスを指定してください
  #
  def self.store(bucket, repository_id, cache_path)
    `tar cvf /tmp/cache.tar #{Pathname(cache_path)}`
    bucket.create_file('/tmp/cache.tar', cache_path(repository_id))
  end

  def self.cache_url(bucket, repository_id)
    "gs://#{bucket.name}/#{cache_path(repository_id)}"
  end

  def self.cache_path(repository_id)
    "caches/#{repository_id}/cache.tar"
  end
end
